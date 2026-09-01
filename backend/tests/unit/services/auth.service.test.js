const { expect } = require("chai");
const sinon = require("sinon");
const jwt = require("jsonwebtoken");

const authService = require("../../../src/services/auth.service");
const User = require("../../../src/models/user.model");
const ApiError = require("../../../src/utils/ApiError");

describe("Auth Service Unit Tests", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("register()", () => {
    it("should register a new user and return user data with token", async () => {
      const userData = {
        name: "Hammad Masood",
        email: "hammad@example.com",
        password: "Password123!",
      };

      const createdUser = {
        _id: "507f191e810c19729de860ea",
        name: userData.name,
        email: userData.email,
        role: "user",
        toJSON: () => ({
          id: "507f191e810c19729de860ea",
          name: userData.name,
          email: userData.email,
          role: "user",
        }),
      };

      sandbox.stub(User, "findOne").resolves(null);
      sandbox.stub(User, "create").resolves(createdUser);
      sandbox.stub(jwt, "sign").returns("mock-jwt-token");

      const result = await authService.register(userData);

      expect(User.findOne.calledOnceWith({ email: userData.email })).to.be.true;
      expect(User.create.calledOnceWith(userData)).to.be.true;
      expect(result).to.deep.equal({
        user: {
          id: "507f191e810c19729de860ea",
          name: userData.name,
          email: userData.email,
          role: "user",
        },
        token: "mock-jwt-token",
      });
    });

    it("should throw 409 ApiError when email is already registered", async () => {
      const userData = {
        name: "Existing User",
        email: "existing@example.com",
        password: "Password123!",
      };

      sandbox.stub(User, "findOne").resolves({ email: userData.email });

      try {
        await authService.register(userData);
        expect.fail("Expected register to throw ApiError");
      } catch (err) {
        expect(err).to.be.instanceOf(ApiError);
        expect(err.statusCode).to.equal(409);
        expect(err.message).to.equal("An account with that email already exists");
      }
    });
  });

  describe("login()", () => {
    it("should log in user with valid credentials and return user with token", async () => {
      const credentials = {
        email: "hammad@example.com",
        password: "Password123!",
      };

      const userDoc = {
        _id: "507f191e810c19729de860ea",
        email: credentials.email,
        role: "user",
        comparePassword: sandbox.stub().resolves(true),
        toJSON: () => ({
          id: "507f191e810c19729de860ea",
          email: credentials.email,
          role: "user",
        }),
      };

      const queryStub = {
        select: sandbox.stub().resolves(userDoc),
      };
      sandbox.stub(User, "findOne").returns(queryStub);
      sandbox.stub(jwt, "sign").returns("mock-login-token");

      const result = await authService.login(credentials);

      expect(User.findOne.calledOnceWith({ email: credentials.email })).to.be.true;
      expect(queryStub.select.calledOnceWith("+password")).to.be.true;
      expect(userDoc.comparePassword.calledOnceWith(credentials.password)).to.be.true;
      expect(result).to.deep.equal({
        user: {
          id: "507f191e810c19729de860ea",
          email: credentials.email,
          role: "user",
        },
        token: "mock-login-token",
      });
    });

    it("should throw 401 ApiError when email does not exist", async () => {
      const credentials = {
        email: "notfound@example.com",
        password: "Password123!",
      };

      const queryStub = {
        select: sandbox.stub().resolves(null),
      };
      sandbox.stub(User, "findOne").returns(queryStub);

      try {
        await authService.login(credentials);
        expect.fail("Expected login to throw ApiError");
      } catch (err) {
        expect(err).to.be.instanceOf(ApiError);
        expect(err.statusCode).to.equal(401);
        expect(err.message).to.equal("Invalid email or password");
      }
    });

    it("should throw 401 ApiError when password does not match", async () => {
      const credentials = {
        email: "hammad@example.com",
        password: "WrongPassword!",
      };

      const userDoc = {
        comparePassword: sandbox.stub().resolves(false),
      };

      const queryStub = {
        select: sandbox.stub().resolves(userDoc),
      };
      sandbox.stub(User, "findOne").returns(queryStub);

      try {
        await authService.login(credentials);
        expect.fail("Expected login to throw ApiError");
      } catch (err) {
        expect(err).to.be.instanceOf(ApiError);
        expect(err.statusCode).to.equal(401);
        expect(err.message).to.equal("Invalid email or password");
      }
    });
  });
});
