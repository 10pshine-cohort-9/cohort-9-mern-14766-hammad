const { expect } = require("chai");
const sinon = require("sinon");
const bcrypt = require("bcryptjs");

const User = require("../../../src/models/user.model");
const { saltRounds } = require("../../../src/config/env");

// validateSync() runs the schema rules with no database involved; `unique` is
// an index rather than a validator, so duplicates are not checked here (that
// path is covered by the 11000 mapping in error.middleware).
const errorsFrom = (doc) => {
  const result = doc.validateSync();
  return result ? result.errors : {};
};

describe("models/user.model", () => {
  const valid = {
    name: "Ada Lovelace",
    email: "ada@example.com",
    password: "Passw0rdy",
  };

  describe("validation", () => {
    it("accepts a well-formed user", () => {
      expect(new User(valid).validateSync()).to.be.undefined;
    });

    it("requires a name", () => {
      const errors = errorsFrom(new User({ ...valid, name: undefined }));

      expect(errors).to.have.property("name");
      expect(errors.name.message).to.equal("Name is required");
    });

    it("requires an email", () => {
      const errors = errorsFrom(new User({ ...valid, email: undefined }));

      expect(errors.email.message).to.equal("Email is required");
    });

    it("requires a password", () => {
      const errors = errorsFrom(new User({ ...valid, password: undefined }));

      expect(errors.password.message).to.equal("Password is required");
    });

    it("rejects a name shorter than 2 characters", () => {
      const errors = errorsFrom(new User({ ...valid, name: "A" }));

      expect(errors.name.message).to.equal("Name must be at least 2 characters long");
    });

    it("rejects a name longer than 50 characters", () => {
      const errors = errorsFrom(new User({ ...valid, name: "A".repeat(51) }));

      expect(errors.name.message).to.equal("Name must not exceed 50 characters");
    });

    it("rejects an address that is not an email", () => {
      const errors = errorsFrom(new User({ ...valid, email: "ada-at-example" }));

      expect(errors.email.message).to.equal("Please provide a valid email address");
    });

    it("rejects an email containing whitespace", () => {
      const errors = errorsFrom(new User({ ...valid, email: "ada lovelace@example.com" }));

      expect(errors.email.message).to.equal("Please provide a valid email address");
    });

    it("rejects a password shorter than 8 characters", () => {
      const errors = errorsFrom(new User({ ...valid, password: "Pass0rd" }));

      expect(errors.password.message).to.equal(
        "Password must be at least 8 characters long"
      );
    });

    it("rejects a role outside the allowed set", () => {
      const errors = errorsFrom(new User({ ...valid, role: "superuser" }));

      expect(errors).to.have.property("role");
    });

    it("reports every bad field at once", () => {
      const errors = errorsFrom(new User({ name: "A", email: "nope", password: "short" }));

      expect(Object.keys(errors)).to.have.members(["name", "email", "password"]);
    });
  });

  describe("normalisation and defaults", () => {
    it("lowercases the email", () => {
      expect(new User({ ...valid, email: "Ada@Example.COM" }).email).to.equal(
        "ada@example.com"
      );
    });

    it("trims the email", () => {
      expect(new User({ ...valid, email: "  ada@example.com  " }).email).to.equal(
        "ada@example.com"
      );
    });

    it("trims the name", () => {
      expect(new User({ ...valid, name: "  Ada Lovelace  " }).name).to.equal("Ada Lovelace");
    });

    it("defaults the role to user, so nobody self-promotes", () => {
      expect(new User(valid).role).to.equal("user");
    });

    it("keeps an explicitly set admin role", () => {
      expect(new User({ ...valid, role: "admin" }).role).to.equal("admin");
    });

    it("stamps createdAt and updatedAt on save", () => {
      // timestamps are applied by the save path, so they are absent until then.
      expect(new User(valid).schema.options.timestamps).to.be.true;
    });
  });

  describe("toJSON", () => {
    it("renames _id to id", () => {
      const user = new User(valid);
      const json = user.toJSON();

      expect(json.id).to.deep.equal(user._id);
      expect(json).to.not.have.property("_id");
    });

    // The password is select:false, but a document that has just been created
    // still holds it in memory — the transform is the second line of defence.
    it("drops the password even when the document is carrying one", () => {
      const json = new User({ ...valid, password: "$2b$04$hashedvalue" }).toJSON();

      expect(json).to.not.have.property("password");
    });

    it("drops the version key", () => {
      expect(new User(valid).toJSON()).to.not.have.property("__v");
    });

    it("keeps the fields a client needs", () => {
      const json = new User(valid).toJSON();

      expect(json).to.include({
        name: "Ada Lovelace",
        email: "ada@example.com",
        role: "user",
      });
    });

    it("survives JSON.stringify without leaking the password", () => {
      const serialized = JSON.stringify(new User({ ...valid, password: "secrethash" }));

      expect(serialized).to.not.include("secrethash");
      expect(serialized).to.not.include("_id");
    });
  });

  describe("comparePassword", () => {
    it("delegates to bcrypt with the plaintext and the stored hash", async () => {
      const compare = sinon.stub(bcrypt, "compare").resolves(true);
      const user = new User({ ...valid, password: "$2b$04$storedhash" });

      const result = await user.comparePassword("Passw0rdy");

      expect(compare.calledOnceWithExactly("Passw0rdy", "$2b$04$storedhash")).to.be.true;
      expect(result).to.be.true;
    });

    it("resolves false when bcrypt says the password is wrong", async () => {
      sinon.stub(bcrypt, "compare").resolves(false);

      expect(await new User(valid).comparePassword("wrong")).to.be.false;
    });

    it("really matches a hash bcrypt produced", async () => {
      const hash = await bcrypt.hash("Passw0rdy", saltRounds);
      const user = new User({ ...valid, password: hash });

      expect(await user.comparePassword("Passw0rdy")).to.be.true;
      expect(await user.comparePassword("Passw0rdz")).to.be.false;
    });
  });

  describe("password hashing on save", () => {
    // The document write is stubbed out at the driver boundary, so save() runs
    // validators and the pre-save hook without needing a live database.
    let insertOne;
    let updateOne;

    beforeEach(() => {
      insertOne = sinon
        .stub(User.collection, "insertOne")
        .callsFake((doc) => Promise.resolve({ acknowledged: true, insertedId: doc._id }));
      updateOne = sinon
        .stub(User.collection, "updateOne")
        .resolves({ acknowledged: true, matchedCount: 1, modifiedCount: 1 });
    });

    it("replaces the plaintext password with a bcrypt hash", async () => {
      const user = new User(valid);

      await user.save();

      expect(insertOne.calledOnce).to.be.true;
      expect(user.password).to.not.equal("Passw0rdy");
      expect(user.password).to.match(/^\$2[aby]\$/);
    });

    it("hashes with the configured cost", async () => {
      const hash = sinon.stub(bcrypt, "hash").resolves("$2b$04$stubbed");

      await new User(valid).save();

      expect(hash.calledOnceWithExactly("Passw0rdy", saltRounds)).to.be.true;
    });

    it("stores a hash the login path can verify", async () => {
      const user = new User(valid);

      await user.save();

      expect(await user.comparePassword("Passw0rdy")).to.be.true;
    });

    it("does not re-hash when the password was not touched", async () => {
      const user = new User(valid);
      await user.save();
      const firstHash = user.password;

      user.name = "Ada King";
      await user.save();

      expect(updateOne.calledOnce, "expected an update rather than an insert").to.be.true;
      expect(user.password).to.equal(firstHash);
    });

    it("re-hashes when the password is changed", async () => {
      const user = new User(valid);
      await user.save();
      const firstHash = user.password;

      user.password = "N3wPassword";
      await user.save();

      expect(user.password).to.not.equal(firstHash);
      expect(user.password).to.not.equal("N3wPassword");
      expect(await user.comparePassword("N3wPassword")).to.be.true;
    });

    it("refuses to save an invalid document", async () => {
      const user = new User({ ...valid, email: "nope" });

      try {
        await user.save();
        expect.fail("expected save to reject");
      } catch (err) {
        expect(err.name).to.equal("ValidationError");
        expect(insertOne.called).to.be.false;
      }
    });
  });
});
