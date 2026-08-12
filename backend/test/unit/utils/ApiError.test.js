const { expect } = require("chai");

const ApiError = require("../../../src/utils/ApiError");

describe("utils/ApiError", () => {
  it("is a real Error carrying the status code", () => {
    const error = new ApiError(404, "Note not found");

    expect(error).to.be.instanceOf(Error);
    expect(error).to.be.instanceOf(ApiError);
    expect(error.statusCode).to.equal(404);
    expect(error.message).to.equal("Note not found");
  });

  // errorHandler does `if (apiError.errors)`, so the property has to be absent
  // rather than undefined for the response body to stay clean.
  it("leaves off the errors property when no field errors are given", () => {
    expect(new ApiError(401, "Authentication required")).to.not.have.property("errors");
  });

  it("keeps the field errors it was given", () => {
    const errors = [{ field: "email", message: "Email is required" }];

    expect(new ApiError(422, "Validation failed", errors).errors).to.deep.equal(errors);
  });

  it("captures a stack trace that starts at the throw site", () => {
    const error = new ApiError(500, "boom");

    expect(error.stack).to.be.a("string");
    // The constructor frame is stripped, so the first frame is the caller.
    expect(error.stack).to.not.include("new ApiError");
  });
});
