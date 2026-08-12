const { expect } = require("chai");
const sinon = require("sinon");

const asyncHandler = require("../../../src/utils/asyncHandler");
const { fakeReq, fakeRes } = require("../../helpers");

describe("utils/asyncHandler", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = fakeReq();
    res = fakeRes();
    next = sinon.stub();
  });

  it("passes req, res and next straight through to the handler", async () => {
    const handler = sinon.stub().resolves();

    await asyncHandler(handler)(req, res, next);

    expect(handler.calledOnceWithExactly(req, res, next)).to.be.true;
  });

  it("does not touch next when the handler resolves", async () => {
    await asyncHandler(async () => "done")(req, res, next);

    expect(next.called).to.be.false;
  });

  it("forwards a rejection to next", async () => {
    const boom = new Error("boom");

    await asyncHandler(async () => {
      throw boom;
    })(req, res, next);

    expect(next.calledOnceWithExactly(boom)).to.be.true;
  });

  it("forwards a rejection from a handler that returns a bare promise", async () => {
    const boom = new Error("rejected");

    await asyncHandler(() => Promise.reject(boom))(req, res, next);

    expect(next.calledOnceWithExactly(boom)).to.be.true;
  });

  it("works with a synchronous handler that returns a non-promise", async () => {
    await asyncHandler(() => 42)(req, res, next);

    expect(next.called).to.be.false;
  });

  // Every handler wrapped in the app is async, so a throw always arrives as a
  // rejection. A synchronous throw escapes before Promise.resolve() sees it,
  // and Express 5 catches that case itself.
  it("lets a synchronous throw propagate to the caller", () => {
    const boom = new Error("sync boom");
    const wrapped = asyncHandler(() => {
      throw boom;
    });

    expect(() => wrapped(req, res, next)).to.throw(boom);
    expect(next.called).to.be.false;
  });
});
