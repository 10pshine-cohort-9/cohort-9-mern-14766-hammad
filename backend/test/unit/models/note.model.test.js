const { expect } = require("chai");
const mongoose = require("mongoose");

const Note = require("../../../src/models/note.model");
const { objectId } = require("../../helpers");

const errorsFrom = (doc) => {
  const result = doc.validateSync();
  return result ? result.errors : {};
};

describe("models/note.model", () => {
  const owner = objectId();
  const valid = { title: "Groceries", content: "Milk, eggs, bread", user: owner };

  describe("validation", () => {
    it("accepts a well-formed note", () => {
      expect(new Note(valid).validateSync()).to.be.undefined;
    });

    it("requires a title", () => {
      const errors = errorsFrom(new Note({ ...valid, title: undefined }));

      expect(errors.title.message).to.equal("Title is required");
    });

    it("requires content", () => {
      const errors = errorsFrom(new Note({ ...valid, content: undefined }));

      expect(errors.content.message).to.equal("Content is required");
    });

    // A note always belongs to exactly one account; an ownerless note would be
    // unreachable by every query in the service, which filters on the owner.
    it("requires an owner", () => {
      const errors = errorsFrom(new Note({ ...valid, user: undefined }));

      expect(errors).to.have.property("user");
    });

    it("rejects a title that is only whitespace", () => {
      const errors = errorsFrom(new Note({ ...valid, title: "   " }));

      expect(errors.title.message).to.equal("Title is required");
    });

    it("rejects a title longer than 120 characters", () => {
      const errors = errorsFrom(new Note({ ...valid, title: "a".repeat(121) }));

      expect(errors.title.message).to.equal("Title must not exceed 120 characters");
    });

    it("accepts a title of exactly 120 characters", () => {
      expect(new Note({ ...valid, title: "a".repeat(120) }).validateSync()).to.be.undefined;
    });

    it("rejects content longer than 10000 characters", () => {
      const errors = errorsFrom(new Note({ ...valid, content: "a".repeat(10001) }));

      expect(errors.content.message).to.equal("Content must not exceed 10000 characters");
    });

    it("accepts content of exactly 10000 characters", () => {
      expect(new Note({ ...valid, content: "a".repeat(10000) }).validateSync()).to.be
        .undefined;
    });

    it("rejects an owner that is not a valid ObjectId", () => {
      const errors = errorsFrom(new Note({ ...valid, user: "not-an-object-id" }));

      expect(errors).to.have.property("user");
      expect(errors.user.name).to.equal("CastError");
    });
  });

  describe("normalisation", () => {
    it("trims the title", () => {
      expect(new Note({ ...valid, title: "  Groceries  " }).title).to.equal("Groceries");
    });

    it("trims the content", () => {
      expect(new Note({ ...valid, content: "  Milk  " }).content).to.equal("Milk");
    });

    it("casts a string owner id to an ObjectId", () => {
      const note = new Note({ ...valid, user: String(owner) });

      expect(note.user).to.be.instanceOf(mongoose.Types.ObjectId);
      expect(String(note.user)).to.equal(String(owner));
    });
  });

  describe("toJSON", () => {
    it("renames _id to id", () => {
      const note = new Note(valid);
      const json = note.toJSON();

      expect(json.id).to.deep.equal(note._id);
      expect(json).to.not.have.property("_id");
    });

    it("drops the version key", () => {
      expect(new Note(valid).toJSON()).to.not.have.property("__v");
    });

    it("keeps the title, content and owner", () => {
      const json = new Note(valid).toJSON();

      expect(json.title).to.equal("Groceries");
      expect(json.content).to.equal("Milk, eggs, bread");
      expect(String(json.user)).to.equal(String(owner));
    });
  });

  describe("indexes", () => {
    // Every read is scoped to one owner and sorted newest first, so the pair is
    // indexed rather than the owner alone.
    it("indexes owner and creation time together, newest first", () => {
      const fields = Note.schema.indexes().map(([spec]) => spec);

      expect(fields).to.deep.include({ user: 1, createdAt: -1 });
    });
  });

  it("records timestamps", () => {
    expect(Note.schema.options.timestamps).to.be.true;
  });
});
