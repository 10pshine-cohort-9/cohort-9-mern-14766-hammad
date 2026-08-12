const { expect } = require("chai");
const sinon = require("sinon");
const jwt = require("jsonwebtoken");

const User = require("../../../src/models/user.model");
const authService = require("../../../src/services/auth.service");
const { jwtSecret } = require("../../../src/config/env");
const { fakeUser, expectApiError } = require("../../helpers");

describe("services/auth.service", () => {
  describe("register", () => {
    const credentials = {
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "Passw0rdy",
    };

    it("creates the user when the email is free", async () => {
      const created = fakeUser(credentials);
      sinon.stub(User, "findOne").resolves(null);
      const create = sinon.stub(User, "create").resolves(created);

      const result = await authService.register(credentials);

      expect(create.calledOnceWithExactly(credentials)).to.be.true;
      expect(result.user.email).to.equal("ada@example.com");
    });

    it("checks for an existing account by email before creating", async () => {
      const findOne = sinon.stub(User, "findOne").resolves(null);
      sinon.stub(User, "create").resolves(fakeUser(credentials));

      await authService.register(credentials);

      expect(findOne.calledOnceWithExactly({ email: "ada@example.com" })).to.be.true;
    });

    it("returns a token the new user's id can be read back from", async () => {
      const created = fakeUser(credentials);
      sinon.stub(User, "findOne").resolves(null);
      sinon.stub(User, "create").resolves(created);

      const { token } = await authService.register(credentials);

      expect(jwt.verify(token, jwtSecret).sub).to.equal(String(created._id));
    });

    it("returns the user through toJSON, so no password hash escapes", async () => {
      const created = fakeUser({ ...credentials, password: "$2b$04$hashedvalue" });
      sinon.stub(User, "findOne").resolves(null);
      sinon.stub(User, "create").resolves(created);

      const { user } = await authService.register(credentials);

      expect(user).to.not.have.property("password");
      expect(user).to.not.have.property("_id");
      expect(user.id).to.equal(String(created._id));
    });

    it("rejects a duplicate email with 409", async () => {
      sinon.stub(User, "findOne").resolves(fakeUser(credentials));
      const create = sinon.stub(User, "create");

      await expectApiError(
        authService.register(credentials),
        409,
        "An account with that email already exists"
      );

      expect(create.called, "must not attempt to create the duplicate").to.be.false;
    });

    // Schema validation failures are mapped to a 422 by errorHandler, so the
    // service deliberately does not catch them.
    it("lets a model validation error bubble up untouched", async () => {
      const validationError = Object.assign(new Error("bad"), { name: "ValidationError" });
      sinon.stub(User, "findOne").resolves(null);
      sinon.stub(User, "create").rejects(validationError);

      try {
        await authService.register(credentials);
        expect.fail("expected register to reject");
      } catch (err) {
        expect(err).to.equal(validationError);
      }
    });
  });

  describe("login", () => {
    const credentials = { email: "ada@example.com", password: "Passw0rdy" };

    // findOne(...).select("+password") — the query is only awaited after
    // select(), so the stub has to return a thenable-producing chain.
    const stubFindOne = (resolved) => {
      const select = sinon.stub().resolves(resolved);
      const findOne = sinon.stub(User, "findOne").returns({ select });
      return { findOne, select };
    };

    it("asks for the password field explicitly", async () => {
      const { findOne, select } = stubFindOne(fakeUser());

      await authService.login(credentials);

      expect(findOne.calledOnceWithExactly({ email: "ada@example.com" })).to.be.true;
      expect(select.calledOnceWithExactly("+password")).to.be.true;
    });

    it("returns the user and a token when the password matches", async () => {
      const user = fakeUser({ email: credentials.email });
      stubFindOne(user);

      const result = await authService.login(credentials);

      expect(user.comparePassword.calledOnceWithExactly("Passw0rdy")).to.be.true;
      expect(result.user.email).to.equal("ada@example.com");
      expect(jwt.verify(result.token, jwtSecret).sub).to.equal(String(user._id));
    });

    it("never returns the password hash", async () => {
      stubFindOne(fakeUser({ password: "$2b$04$hashedvalue" }));

      const { user } = await authService.login(credentials);

      expect(user).to.not.have.property("password");
    });

    it("rejects an unknown email with 401", async () => {
      stubFindOne(null);

      await expectApiError(authService.login(credentials), 401, "Invalid email or password");
    });

    it("rejects a wrong password with 401", async () => {
      const user = fakeUser();
      user.comparePassword.resolves(false);
      stubFindOne(user);

      await expectApiError(authService.login(credentials), 401, "Invalid email or password");
    });

    // The two failures must be indistinguishable, or the endpoint becomes a
    // way to find out which emails are registered.
    it("uses an identical message for an unknown email and a wrong password", async () => {
      stubFindOne(null);
      const unknownEmail = await expectApiError(authService.login(credentials), 401);
      sinon.restore();

      const user = fakeUser();
      user.comparePassword.resolves(false);
      stubFindOne(user);
      const wrongPassword = await expectApiError(authService.login(credentials), 401);

      expect(unknownEmail.message).to.equal(wrongPassword.message);
      expect(unknownEmail.statusCode).to.equal(wrongPassword.statusCode);
    });

    it("does not compare a password when there is no user", async () => {
      const user = fakeUser();
      stubFindOne(null);

      await expectApiError(authService.login(credentials), 401);

      expect(user.comparePassword.called).to.be.false;
    });
  });
});
