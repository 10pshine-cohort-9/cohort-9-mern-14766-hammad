const { expect } = require("chai");
const sinon = require("sinon");
const { body, param } = require("express-validator");

const validate = require("../../../src/middleware/validate");
const { fakeReq, fakeRes, errorPassedTo, runValidators } = require("../../helpers");

describe("middleware/validate", () => {
  let res;
  let next;

  beforeEach(() => {
    res = fakeRes();
    next = sinon.stub();
  });

  it("continues without an error when everything validates", async () => {
    const req = fakeReq({ body: { email: "ada@example.com" } });
    await runValidators([body("email").isEmail()], req);

    validate(req, res, next);

    expect(next.calledOnceWithExactly()).to.be.true;
  });

  it("continues when no validators ran at all", () => {
    validate(fakeReq(), res, next);

    expect(next.calledOnceWithExactly()).to.be.true;
  });

  it("rejects with a 422 when a field fails", async () => {
    const req = fakeReq({ body: {} });
    await runValidators(
      [body("email").notEmpty().withMessage("Email is required")],
      req
    );

    validate(req, res, next);

    errorPassedTo(next, 422, "Validation failed");
  });

  // Reports every bad field at once instead of one per round trip.
  it("collects every failing field into one error", async () => {
    const req = fakeReq({ body: {} });
    await runValidators(
      [
        body("name").notEmpty().withMessage("Name is required"),
        body("email").notEmpty().withMessage("Email is required"),
        body("password").notEmpty().withMessage("Password is required"),
      ],
      req
    );

    validate(req, res, next);

    const error = errorPassedTo(next, 422);
    expect(error.errors).to.deep.equal([
      { field: "name", message: "Name is required" },
      { field: "email", message: "Email is required" },
      { field: "password", message: "Password is required" },
    ]);
  });

  it("reports a failing path parameter", async () => {
    const req = fakeReq({ params: { id: "not-an-id" } });
    await runValidators(
      [param("id").isMongoId().withMessage("Note id is not a valid identifier")],
      req
    );

    validate(req, res, next);

    const error = errorPassedTo(next, 422);
    expect(error.errors).to.deep.equal([
      { field: "id", message: "Note id is not a valid identifier" },
    ]);
  });

  it("never answers the request itself", async () => {
    const req = fakeReq({ body: {} });
    await runValidators([body("email").notEmpty()], req);

    validate(req, res, next);

    expect(res.json.called).to.be.false;
    expect(res.status.called).to.be.false;
  });
});
