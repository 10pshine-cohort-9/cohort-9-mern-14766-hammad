const { expect } = require("chai");
const sinon = require("sinon");

const { notFound, errorHandler } = require("../../../src/middleware/error.middleware");
const ApiError = require("../../../src/utils/ApiError");
const logger = require("../../../src/config/logger");
const { bodyLimit } = require("../../../src/config/env");
const { fakeReq, fakeRes, errorPassedTo } = require("../../helpers");

describe("middleware/error.middleware", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = fakeReq();
    res = fakeRes();
    next = sinon.stub();
  });

  describe("notFound", () => {
    it("turns an unmatched route into a 404 naming the method and path", () => {
      notFound(fakeReq({ method: "PUT", originalUrl: "/api/v1/nope" }), res, next);

      errorPassedTo(next, 404, "Route not found: PUT /api/v1/nope");
    });

    // It hands the error on rather than answering, so errorHandler stays the
    // single place a response is shaped.
    it("does not answer the request itself", () => {
      notFound(req, res, next);

      expect(res.json.called).to.be.false;
      expect(res.status.called).to.be.false;
    });
  });

  describe("errorHandler — mapping framework errors", () => {
    it("passes an ApiError through unchanged", () => {
      errorHandler(new ApiError(404, "Note not found"), req, res, next);

      expect(res.status.calledOnceWithExactly(404)).to.be.true;
      expect(res.body).to.deep.equal({ success: false, message: "Note not found" });
    });

    it("includes field errors when the ApiError carries them", () => {
      const errors = [{ field: "email", message: "Email is required" }];

      errorHandler(new ApiError(422, "Validation failed", errors), req, res, next);

      expect(res.body).to.deep.equal({
        success: false,
        message: "Validation failed",
        errors,
      });
    });

    it("omits the errors key when the ApiError has none", () => {
      errorHandler(new ApiError(401, "Authentication required"), req, res, next);

      expect(res.body).to.not.have.property("errors");
    });

    it("turns a Mongoose ValidationError into a 422 listing every field", () => {
      const err = Object.assign(new Error("validation failed"), {
        name: "ValidationError",
        errors: {
          title: { path: "title", message: "Title is required" },
          content: { path: "content", message: "Content is required" },
        },
      });

      errorHandler(err, req, res, next);

      expect(res.status.calledOnceWithExactly(422)).to.be.true;
      expect(res.body.message).to.equal("Validation failed");
      expect(res.body.errors).to.deep.equal([
        { field: "title", message: "Title is required" },
        { field: "content", message: "Content is required" },
      ]);
    });

    it("turns a duplicate key error into a 409 naming the field", () => {
      const err = Object.assign(new Error("E11000"), {
        code: 11000,
        keyPattern: { email: 1 },
      });

      errorHandler(err, req, res, next);

      expect(res.status.calledOnceWithExactly(409)).to.be.true;
      expect(res.body.message).to.equal("An account with that email already exists");
    });

    it("falls back to 'field' when the duplicate key error names nothing", () => {
      errorHandler(Object.assign(new Error("E11000"), { code: 11000 }), req, res, next);

      expect(res.status.calledOnceWithExactly(409)).to.be.true;
      expect(res.body.message).to.equal("An account with that field already exists");
    });

    it("turns a CastError into a 400 naming the path", () => {
      const err = Object.assign(new Error("cast failed"), {
        name: "CastError",
        path: "_id",
      });

      errorHandler(err, req, res, next);

      expect(res.status.calledOnceWithExactly(400)).to.be.true;
      expect(res.body.message).to.equal("Invalid value for _id");
    });

    it("turns malformed JSON into a 400", () => {
      const err = Object.assign(new SyntaxError("Unexpected token"), {
        type: "entity.parse.failed",
        status: 400,
        expose: true,
      });

      errorHandler(err, req, res, next);

      expect(res.status.calledOnceWithExactly(400)).to.be.true;
      expect(res.body.message).to.equal("Request body contains malformed JSON");
    });

    // Quoting the limit is the difference between a client trimming the
    // payload and retrying it blindly.
    it("turns an oversized body into a 413 quoting the limit", () => {
      const err = Object.assign(new Error("request entity too large"), {
        type: "entity.too.large",
        status: 413,
      });

      errorHandler(err, req, res, next);

      expect(res.status.calledOnceWithExactly(413)).to.be.true;
      expect(res.body.message).to.equal(`Request body exceeds the ${bodyLimit} limit`);
    });

    // Everything else body-parser raises is built by http-errors, which
    // already sets a safe status and message.
    it("honours a 4xx from http-errors that marks itself safe to expose", () => {
      const err = Object.assign(new Error("unsupported charset"), {
        status: 415,
        expose: true,
      });

      errorHandler(err, req, res, next);

      expect(res.status.calledOnceWithExactly(415)).to.be.true;
      expect(res.body.message).to.equal("unsupported charset");
    });

    it("reads statusCode when http-errors used that spelling", () => {
      const err = Object.assign(new Error("too many parameters"), {
        statusCode: 413,
        expose: true,
      });

      errorHandler(err, req, res, next);

      expect(res.status.calledOnceWithExactly(413)).to.be.true;
      expect(res.body.message).to.equal("too many parameters");
    });

    it("does not expose a 5xx even when the error asks to be exposed", () => {
      const err = Object.assign(new Error("upstream exploded"), {
        status: 502,
        expose: true,
      });

      errorHandler(err, req, res, next);

      expect(res.status.calledOnceWithExactly(500)).to.be.true;
      expect(res.body.message).to.equal("Internal server error");
    });

    it("ignores a 4xx status that is not exposable", () => {
      const err = Object.assign(new Error("internal detail"), { status: 400 });

      errorHandler(err, req, res, next);

      expect(res.status.calledOnceWithExactly(500)).to.be.true;
      expect(res.body.message).to.equal("Internal server error");
    });
  });

  describe("errorHandler — unrecognised errors", () => {
    it("answers a generic 500 without leaking the message", () => {
      errorHandler(new Error("connection string: mongodb://user:hunter2@host"), req, res, next);

      expect(res.status.calledOnceWithExactly(500)).to.be.true;
      expect(res.body).to.deep.equal({ success: false, message: "Internal server error" });
      expect(JSON.stringify(res.body)).to.not.include("hunter2");
    });

    it("logs the error with its stack, because it is a genuine bug", () => {
      const boom = new Error("boom");

      errorHandler(boom, req, res, next);

      expect(req.log.error.calledOnce).to.be.true;
      const [fields, message] = req.log.error.firstCall.args;
      expect(fields).to.include({ event: "server.error" });
      expect(fields.err).to.equal(boom);
      expect(message).to.equal("Unhandled error: boom");
      expect(req.log.warn.called).to.be.false;
    });
  });

  describe("errorHandler — log levels and events", () => {
    // Paging someone for a wrong password would be noise, so expected
    // rejections are warnings with no stack.
    it("logs an expected rejection as a warning", () => {
      errorHandler(new ApiError(404, "Note not found"), req, res, next);

      expect(req.log.warn.calledOnce).to.be.true;
      expect(req.log.error.called).to.be.false;
      expect(req.log.warn.firstCall.args[0]).to.not.have.property("err");
    });

    it("tags a 401 as auth.denied", () => {
      errorHandler(new ApiError(401, "Authentication required"), req, res, next);

      expect(req.log.warn.firstCall.args[0]).to.include({
        event: "auth.denied",
        statusCode: 401,
      });
    });

    it("tags a 403 as auth.forbidden", () => {
      errorHandler(new ApiError(403, "You do not have permission to do that"), req, res, next);

      expect(req.log.warn.firstCall.args[0]).to.include({
        event: "auth.forbidden",
        statusCode: 403,
      });
    });

    // A rejected credential and a rejected note id are both 4xx, but only the
    // first matters when someone is reading the logs after a breach.
    it("tags every other rejection as request.rejected", () => {
      errorHandler(new ApiError(422, "Validation failed"), req, res, next);

      expect(req.log.warn.firstCall.args[0]).to.include({
        event: "request.rejected",
        statusCode: 422,
      });
    });

    it("includes the field errors in the log line", () => {
      const errors = [{ field: "email", message: "Email is required" }];

      errorHandler(new ApiError(422, "Validation failed", errors), req, res, next);

      expect(req.log.warn.firstCall.args[0].errors).to.deep.equal(errors);
    });

    // req.log is missing for an error raised before the http logger ran.
    it("falls back to the module logger when the request has none", () => {
      const warn = sinon.stub(logger, "warn");

      errorHandler(new ApiError(400, "too early"), fakeReq({ log: undefined }), res, next);

      expect(warn.calledOnce).to.be.true;
      expect(res.status.calledOnceWithExactly(400)).to.be.true;
    });

    it("falls back to the module logger for an unknown error too", () => {
      const error = sinon.stub(logger, "error");

      errorHandler(new Error("boom"), fakeReq({ log: undefined }), res, next);

      expect(error.calledOnce).to.be.true;
      expect(res.status.calledOnceWithExactly(500)).to.be.true;
    });
  });
});
