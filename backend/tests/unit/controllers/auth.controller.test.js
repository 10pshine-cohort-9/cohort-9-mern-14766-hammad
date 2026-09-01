const { expect } = require("chai");
const sinon = require("sinon");

const authController = require("../../../src/controllers/auth.controller");
const authService = require("../../../src/services/auth.service");

describe("Auth Controller Unit Tests", () => {
  let sandbox;
  let req;
  let res;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      body: {},
      user: null,
    };

    res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.stub().returnsThis(),
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("register()", () => {
    it("should call authService.register and send 201 response", async () => {
      req.body = {
        name: "Hammad",
        email: "hammad@example.com",
        password: "Password123!",
      };

      const mockData = {
        user: { id: "123", name: "Hammad", email: "hammad@example.com" },
        token: "token123",
      };

      sandbox.stub(authService, "register").resolves(mockData);

      await authController.register(req, res);

      expect(authService.register.calledOnceWith(req.body)).to.be.true;
      expect(res.status.calledOnceWith(201)).to.be.true;
      expect(res.json.calledOnceWith({
        success: true,
        message: "Account created successfully",
        data: mockData,
      })).to.be.true;
    });
  });

  describe("login()", () => {
    it("should call authService.login and send 200 response with data", async () => {
      req.body = {
        email: "hammad@example.com",
        password: "Password123!",
      };

      const mockData = {
        user: { id: "123", email: "hammad@example.com" },
        token: "token123",
      };

      sandbox.stub(authService, "login").resolves(mockData);

      await authController.login(req, res);

      expect(authService.login.calledOnceWith(req.body)).to.be.true;
      expect(res.json.calledOnceWith({
        success: true,
        message: "Logged in successfully",
        data: mockData,
      })).to.be.true;
    });
  });

  describe("getMe()", () => {
    it("should return profile details of req.user", () => {
      const userJson = { id: "123", name: "Hammad", email: "hammad@example.com" };
      req.user = {
        toJSON: sandbox.stub().returns(userJson),
      };

      authController.getMe(req, res);

      expect(req.user.toJSON.calledOnce).to.be.true;
      expect(res.json.calledOnceWith({
        success: true,
        message: "Profile retrieved successfully",
        data: { user: userJson },
      })).to.be.true;
    });
  });
});
