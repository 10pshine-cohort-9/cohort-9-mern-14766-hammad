const { expect } = require("chai");
const sinon = require("sinon");
const jwt = require("jsonwebtoken");

const User = require("../../../src/models/user.model");
const { authenticate, authorize } = require("../../../src/middleware/auth.middleware");
const { signToken } = require("../../../src/utils/jwt");
const { jwtSecret } = require("../../../src/config/env");
const { fakeReq, fakeRes, fakeUser, errorPassedTo, objectId } = require("../../helpers");

describe("middleware/auth.middleware", () => {
  let res;
  let next;

  beforeEach(() => {
    res = fakeRes();
    next = sinon.stub();
  });

  describe("authenticate — rejecting unauthorized requests", () => {
    const reqWith = (authorization) =>
      fakeReq({ headers: authorization === undefined ? {} : { authorization } });

    it("rejects a request with no Authorization header", async () => {
      const findById = sinon.stub(User, "findById");

      await authenticate(reqWith(undefined), res, next);

      errorPassedTo(next, 401, "Authentication required");
      expect(findById.called, "must not query before a token is verified").to.be.false;
    });

    it("rejects an empty Authorization header", async () => {
      await authenticate(reqWith(""), res, next);

      errorPassedTo(next, 401, "Authentication required");
    });

    it("rejects a Bearer header with no token after it", async () => {
      await authenticate(reqWith("Bearer"), res, next);

      errorPassedTo(next, 401, "Authentication required");
    });

    it("rejects a Bearer header whose token is blank", async () => {
      await authenticate(reqWith("Bearer "), res, next);

      errorPassedTo(next, 401, "Authentication required");
    });

    it("rejects a non-Bearer scheme", async () => {
      await authenticate(reqWith("Basic YWRhOnNlY3JldA=="), res, next);

      errorPassedTo(next, 401, "Authentication required");
    });

    it("rejects a bare token with no scheme", async () => {
      await authenticate(reqWith(signToken(fakeUser())), res, next);

      errorPassedTo(next, 401, "Authentication required");
    });

    it("rejects a garbage token", async () => {
      await authenticate(reqWith("Bearer not-a-jwt"), res, next);

      errorPassedTo(next, 401, "Invalid authentication token");
    });

    it("rejects a token signed with a different secret", async () => {
      const forged = jwt.sign({ sub: String(objectId()), role: "admin" }, "attacker-secret");

      await authenticate(reqWith(`Bearer ${forged}`), res, next);

      errorPassedTo(next, 401, "Invalid authentication token");
    });

    it("rejects a token whose payload was tampered with", async () => {
      const [header, , signature] = signToken(fakeUser()).split(".");
      const payload = Buffer.from(
        JSON.stringify({ sub: String(objectId()), role: "admin" })
      ).toString("base64url");

      await authenticate(reqWith(`Bearer ${header}.${payload}.${signature}`), res, next);

      errorPassedTo(next, 401, "Invalid authentication token");
    });

    // Told apart from a bad signature so the client knows to log in again
    // rather than treating its credentials as wrong.
    it("tells the caller when a token has merely expired", async () => {
      const expired = jwt.sign({ sub: String(objectId()) }, jwtSecret, { expiresIn: "-1s" });

      await authenticate(reqWith(`Bearer ${expired}`), res, next);

      errorPassedTo(next, 401, "Token has expired, please log in again");
    });

    // The user is re-read every request so a deleted account stops working at
    // once instead of when its token happens to expire.
    it("rejects a valid token whose account has since been deleted", async () => {
      const user = fakeUser();
      sinon.stub(User, "findById").resolves(null);

      const req = reqWith(`Bearer ${signToken(user)}`);
      await authenticate(req, res, next);

      errorPassedTo(next, 401, "This user no longer exists");
      expect(req.user).to.be.undefined;
    });

    it("never attaches a user when it rejects", async () => {
      const req = reqWith("Bearer not-a-jwt");

      await authenticate(req, res, next);

      expect(req.user).to.be.undefined;
    });

    it("never lets the request continue when it rejects", async () => {
      await authenticate(reqWith(undefined), res, next);

      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0], "next() must be called with an error").to.exist;
    });
  });

  describe("authenticate — accepting a valid token", () => {
    it("attaches the user and continues", async () => {
      const user = fakeUser();
      sinon.stub(User, "findById").resolves(user);
      const req = fakeReq({ headers: { authorization: `Bearer ${signToken(user)}` } });

      await authenticate(req, res, next);

      expect(req.user).to.equal(user);
      expect(next.calledOnceWithExactly()).to.be.true;
    });

    it("looks the user up by the token's subject", async () => {
      const user = fakeUser();
      const findById = sinon.stub(User, "findById").resolves(user);

      await authenticate(
        fakeReq({ headers: { authorization: `Bearer ${signToken(user)}` } }),
        res,
        next
      );

      expect(findById.calledOnceWithExactly(String(user._id))).to.be.true;
    });

    it("accepts a lowercase bearer scheme", async () => {
      const user = fakeUser();
      sinon.stub(User, "findById").resolves(user);
      const req = fakeReq({ headers: { authorization: `bearer ${signToken(user)}` } });

      await authenticate(req, res, next);

      expect(next.calledOnceWithExactly()).to.be.true;
      expect(req.user).to.equal(user);
    });

    // Rejections are logged once, centrally, by errorHandler; only the
    // accepted case is recorded here.
    it("records the accepted token at debug level", async () => {
      const user = fakeUser();
      sinon.stub(User, "findById").resolves(user);
      const req = fakeReq({ headers: { authorization: `Bearer ${signToken(user)}` } });

      await authenticate(req, res, next);

      expect(req.log.debug.calledOnce).to.be.true;
      const [fields] = req.log.debug.firstCall.args;
      expect(fields).to.include({
        event: "auth.token.accepted",
        userId: String(user._id),
        role: "user",
      });
    });

    it("hands an unexpected database failure to next untouched", async () => {
      const boom = new Error("connection lost");
      sinon.stub(User, "findById").rejects(boom);

      await authenticate(
        fakeReq({ headers: { authorization: `Bearer ${signToken(fakeUser())}` } }),
        res,
        next
      );

      expect(next.calledOnceWithExactly(boom)).to.be.true;
    });
  });

  describe("authorize", () => {
    it("lets a permitted role through", () => {
      authorize("admin")(fakeReq({ user: fakeUser({ role: "admin" }) }), res, next);

      expect(next.calledOnceWithExactly()).to.be.true;
    });

    it("accepts any one of several permitted roles", () => {
      authorize("admin", "user")(fakeReq({ user: fakeUser({ role: "user" }) }), res, next);

      expect(next.calledOnceWithExactly()).to.be.true;
    });

    it("rejects a role that is not on the list with 403", () => {
      authorize("admin")(fakeReq({ user: fakeUser({ role: "user" }) }), res, next);

      errorPassedTo(next, 403, "You do not have permission to do that");
    });

    it("rejects every role when none are permitted", () => {
      authorize()(fakeReq({ user: fakeUser({ role: "admin" }) }), res, next);

      errorPassedTo(next, 403, "You do not have permission to do that");
    });

    // Guards against being mounted without authenticate ahead of it, which
    // would report a routing mistake as a 500 instead of the 401 it is.
    it("reports a missing user as 401 rather than crashing", () => {
      authorize("admin")(fakeReq(), res, next);

      errorPassedTo(next, 401, "Authentication required");
    });

    it("never answers the request itself", () => {
      authorize("admin")(fakeReq({ user: fakeUser({ role: "user" }) }), res, next);

      expect(res.json.called).to.be.false;
      expect(res.status.called).to.be.false;
    });
  });
});
