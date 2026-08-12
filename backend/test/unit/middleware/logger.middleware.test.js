const { expect } = require("chai");

const { statusLevel } = require("../../../src/middleware/logger.middleware");

describe("middleware/logger.middleware", () => {
  // 5xx is ours to fix, 4xx is the caller's mistake, everything else routine.
  describe("statusLevel", () => {
    it("maps 5xx to error", () => {
      expect(statusLevel(500)).to.equal("error");
      expect(statusLevel(503)).to.equal("error");
    });

    it("maps 4xx to warn", () => {
      expect(statusLevel(400)).to.equal("warn");
      expect(statusLevel(401)).to.equal("warn");
      expect(statusLevel(422)).to.equal("warn");
      expect(statusLevel(499)).to.equal("warn");
    });

    it("maps 2xx and 3xx to info", () => {
      expect(statusLevel(200)).to.equal("info");
      expect(statusLevel(201)).to.equal("info");
      expect(statusLevel(304)).to.equal("info");
    });
  });
});
