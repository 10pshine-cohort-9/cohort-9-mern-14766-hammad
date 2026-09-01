const { expect } = require("chai");
const sinon = require("sinon");
const jwt = require("jsonwebtoken");

const { authenticate, authorize } = require("../../../src/middleware/auth.middleware");
const User = require("../../../src/models/user.model");
const ApiError = require("../../../src/utils/ApiError");

describe("Auth Middleware Unit Tests", () => {
  let sandbox;
  let req;
  let res;
  let next;

  const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      headers: {},
      log: {
        debug: sandbox.stub(),
      },
    };

    res = {};
    next = sandbox.stub();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("authenticate()", () => {
    it("should pass 401 ApiError to next() if Authorization header is missing", async () => {
      await authenticate(req, res, next);
      await flushPromises();

      expect(next.calledOnce).to.be.true;
      const err = next.firstCall.args[0];
      expect(err).to.be.instanceOf(ApiError);
      expect(err.statusCode).to.equal(401);
      expect(err.message).to.equal("Authentication required");
    });

    it("should pass 401 ApiError to next() if scheme is not Bearer", async () => {
      req.headers.authorization = "Basic token123";

      await authenticate(req, res, next);
      await flushPromises();

      expect(next.calledOnce).to.be.true;
      const err = next.firstCall.args[0];
      expect(err).to.be.instanceOf(ApiError);
      expect(err.statusCode).to.equal(401);
      expect(err.message).to.equal("Authentication required");
    });

    it("should pass 401 ApiError to next() if token is expired", async () => {
      req.headers.authorization = "Bearer expired-token";

      sandbox.stub(jwt, "verify").throws(new jwt.TokenExpiredError("jwt expired", new Date()));

      await authenticate(req, res, next);
      await flushPromises();

      expect(next.calledOnce).to.be.true;
      const err = next.firstCall.args[0];
      expect(err).to.be.instanceOf(ApiError);
      expect(err.statusCode).to.equal(401);
      expect(err.message).to.equal("Token has expired, please log in again");
    });

    it("should pass 401 ApiError to next() if token is invalid", async () => {
      req.headers.authorization = "Bearer invalid-token";

      sandbox.stub(jwt, "verify").throws(new Error("invalid token signature"));

      await authenticate(req, res, next);
      await flushPromises();

      expect(next.calledOnce).to.be.true;
      const err = next.firstCall.args[0];
      expect(err).to.be.instanceOf(ApiError);
      expect(err.statusCode).to.equal(401);
      expect(err.message).to.equal("Invalid authentication token");
    });

    it("should pass 401 ApiError to next() if user in token payload no longer exists", async () => {
      req.headers.authorization = "Bearer valid-token";

      sandbox.stub(jwt, "verify").returns({ sub: "deleted-user-id" });
      sandbox.stub(User, "findById").resolves(null);

      await authenticate(req, res, next);
      await flushPromises();

      expect(next.calledOnce).to.be.true;
      const err = next.firstCall.args[0];
      expect(err).to.be.instanceOf(ApiError);
      expect(err.statusCode).to.equal(401);
      expect(err.message).to.equal("This user no longer exists");
    });

    it("should set req.user and call next() with no error on valid authentication", async () => {
      req.headers.authorization = "Bearer valid-token";

      const mockUser = {
        id: "507f191e810c19729de860ea",
        role: "user",
      };

      sandbox.stub(jwt, "verify").returns({ sub: mockUser.id });
      sandbox.stub(User, "findById").resolves(mockUser);

      await authenticate(req, res, next);
      await flushPromises();

      expect(req.user).to.equal(mockUser);
      expect(next.calledOnceWithExactly()).to.be.true;
      expect(req.log.debug.calledOnce).to.be.true;
    });
  });

  describe("authorize()", () => {
    it("should call next() if user role is permitted", () => {
      req.user = { role: "admin" };
      const middleware = authorize("admin", "manager");

      middleware(req, res, next);

      expect(next.calledOnceWithExactly()).to.be.true;
    });

    it("should pass 403 ApiError to next() if user role is not permitted", () => {
      req.user = { role: "user" };
      const middleware = authorize("admin");

      middleware(req, res, next);

      expect(next.calledOnce).to.be.true;
      const err = next.firstCall.args[0];
      expect(err).to.be.instanceOf(ApiError);
      expect(err.statusCode).to.equal(403);
      expect(err.message).to.equal("You do not have permission to do that");
    });
  });
});
