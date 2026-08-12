const { expect } = require("chai");
const sinon = require("sinon");

const authController = require("../../../src/controllers/auth.controller");
const authService = require("../../../src/services/auth.service");
const ApiError = require("../../../src/utils/ApiError");
const { fakeReq, fakeRes, fakeUser } = require("../../helpers");

describe("controllers/auth.controller", () => {
  let res;
  let next;

  beforeEach(() => {
    res = fakeRes();
    next = sinon.stub();
  });

  describe("register", () => {
    const body = {
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "Passw0rdy",
    };

    it("answers 201 with the created account", async () => {
      const data = { user: fakeUser(body).toJSON(), token: "signed.jwt.token" };
      sinon.stub(authService, "register").resolves(data);

      await authController.register(fakeReq({ body }), res, next);

      expect(res.status.calledOnceWithExactly(201)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.body).to.deep.equal({
        success: true,
        message: "Account created successfully",
        data,
      });
    });

    // Only the three fields are forwarded, so a client cannot make itself an
    // admin by adding "role" to the request body.
    it("forwards only name, email and password to the service", async () => {
      const register = sinon.stub(authService, "register").resolves({ user: {}, token: "t" });
      const hostile = { ...body, role: "admin", _id: "deadbeef" };

      await authController.register(fakeReq({ body: hostile }), res, next);

      expect(register.calledOnceWithExactly(body)).to.be.true;
    });

    it("hands a service rejection to next instead of answering", async () => {
      const conflict = new ApiError(409, "An account with that email already exists");
      sinon.stub(authService, "register").rejects(conflict);

      await authController.register(fakeReq({ body }), res, next);

      expect(next.calledOnceWithExactly(conflict)).to.be.true;
      expect(res.json.called).to.be.false;
    });
  });

  describe("login", () => {
    const body = { email: "ada@example.com", password: "Passw0rdy" };

    it("answers 200 with the user and token", async () => {
      const data = { user: fakeUser().toJSON(), token: "signed.jwt.token" };
      sinon.stub(authService, "login").resolves(data);

      await authController.login(fakeReq({ body }), res, next);

      // res.json() without res.status() leaves Express's default of 200.
      expect(res.status.called).to.be.false;
      expect(res.body).to.deep.equal({
        success: true,
        message: "Logged in successfully",
        data,
      });
    });

    it("forwards only the credentials to the service", async () => {
      const login = sinon.stub(authService, "login").resolves({ user: {}, token: "t" });

      await authController.login(fakeReq({ body: { ...body, role: "admin" } }), res, next);

      expect(login.calledOnceWithExactly(body)).to.be.true;
    });

    it("hands a rejected credential to next", async () => {
      const unauthorized = new ApiError(401, "Invalid email or password");
      sinon.stub(authService, "login").rejects(unauthorized);

      await authController.login(fakeReq({ body }), res, next);

      expect(next.calledOnceWithExactly(unauthorized)).to.be.true;
      expect(res.json.called).to.be.false;
    });
  });

  describe("getMe", () => {
    // authenticate has already loaded the user, so there is nothing to look up.
    it("serializes the authenticated user without touching the database", () => {
      const user = fakeUser();

      authController.getMe(fakeReq({ user }), res, next);

      expect(res.body).to.deep.equal({
        success: true,
        message: "Profile retrieved successfully",
        data: { user: user.toJSON() },
      });
    });

    it("returns the user through toJSON, so the password hash cannot leak", () => {
      const user = fakeUser({ password: "$2b$04$hashedvalue" });

      authController.getMe(fakeReq({ user }), res, next);

      expect(res.body.data.user).to.not.have.property("password");
      expect(res.body.data.user).to.not.have.property("_id");
    });
  });
});
