const { expect } = require("chai");
const jwt = require("jsonwebtoken");

const { signToken, verifyToken } = require("../../../src/utils/jwt");
const { jwtSecret } = require("../../../src/config/env");
const { fakeUser } = require("../../helpers");

describe("utils/jwt", () => {
  describe("signToken", () => {
    it("puts the user id in sub and nothing else identifying", () => {
      const user = fakeUser({ name: "Ada", email: "ada@example.com" });

      const payload = jwt.verify(signToken(user), jwtSecret);

      expect(payload.sub).to.equal(String(user._id));
      expect(payload.role).to.equal("user");
      // Anything else would go stale the moment the profile is edited.
      expect(payload).to.not.have.property("name");
      expect(payload).to.not.have.property("email");
      expect(payload).to.not.have.property("password");
    });

    it("carries the user's role so authorize() can read it", () => {
      const token = signToken(fakeUser({ role: "admin" }));

      expect(jwt.verify(token, jwtSecret).role).to.equal("admin");
    });

    it("stamps an expiry", () => {
      const payload = jwt.verify(signToken(fakeUser()), jwtSecret);

      expect(payload.exp).to.be.a("number");
      expect(payload.exp).to.be.greaterThan(payload.iat);
    });

    it("serializes an ObjectId subject to a string", () => {
      const payload = jwt.verify(signToken(fakeUser()), jwtSecret);

      expect(payload.sub).to.be.a("string");
    });
  });

  describe("verifyToken", () => {
    it("round-trips a token it signed", () => {
      const user = fakeUser();

      expect(verifyToken(signToken(user)).sub).to.equal(String(user._id));
    });

    it("rejects a token signed with a different secret", () => {
      const forged = jwt.sign({ sub: "abc", role: "admin" }, "some-other-secret");

      expect(() => verifyToken(forged)).to.throw(jwt.JsonWebTokenError);
    });

    it("rejects a tampered token", () => {
      const tampered = `${signToken(fakeUser())}x`;

      expect(() => verifyToken(tampered)).to.throw(jwt.JsonWebTokenError);
    });

    it("rejects a malformed token", () => {
      expect(() => verifyToken("not-a-jwt")).to.throw(jwt.JsonWebTokenError);
    });

    // authenticate() distinguishes this from a bad signature so it can tell
    // the caller to log in again.
    it("rejects an expired token with TokenExpiredError", () => {
      const expired = jwt.sign({ sub: "abc" }, jwtSecret, { expiresIn: "-1s" });

      expect(() => verifyToken(expired)).to.throw(jwt.TokenExpiredError);
    });
  });
});
