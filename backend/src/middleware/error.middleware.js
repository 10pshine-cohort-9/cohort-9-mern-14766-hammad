const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const ApiError = require("../utils/ApiError");
const logger = require("../config/logger");
const { isProduction } = require("../config/env");

const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// Turns the framework's error shapes into an ApiError so responses stay uniform.
const toApiError = (err) => {
  if (err instanceof ApiError) return err;

  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return new ApiError(422, "Validation failed", errors);
  }

  // Duplicate key on a unique index, almost always a re-used email.
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return new ApiError(409, `An account with that ${field} already exists`);
  }

  if (err instanceof mongoose.Error.CastError) {
    return new ApiError(400, `Invalid value for ${err.path}`);
  }

  // A token that reaches here skipped authenticate(), so translate it rather
  // than reporting a client's expired token as a server fault.
  if (err instanceof jwt.TokenExpiredError) {
    return new ApiError(401, "Token has expired, please log in again");
  }

  if (err instanceof jwt.JsonWebTokenError) {
    return new ApiError(401, "Invalid authentication token");
  }

  if (err.type === "entity.parse.failed") {
    return new ApiError(400, "Request body contains malformed JSON");
  }

  if (err.type === "entity.too.large") {
    return new ApiError(413, "Request body is too large");
  }

  // The database being unreachable is not the caller's fault, and 503 is the
  // one 5xx worth retrying.
  if (
    err instanceof mongoose.Error.MongooseServerSelectionError ||
    err.name === "MongoNetworkError"
  ) {
    return new ApiError(503, "Service temporarily unavailable, please try again");
  }

  return null;
};

// A rejected credential and a rejected note id are both 4xx, but only the
// first one matters when someone is reading the logs after a breach.
const eventFor = (statusCode) => {
  if (statusCode === 401) return "auth.denied";
  if (statusCode === 403) return "auth.forbidden";
  return "request.rejected";
};

const errorHandler = (err, req, res, next) => {
  // req.log is a child logger carrying the request id; the module logger is
  // only a fallback for an error raised before the http logger ran.
  const log = req.log || logger;

  // Anything unrecognised is a genuine bug: report it as a 500 with a generic
  // message so an internal detail never reaches the client.
  const apiError = toApiError(err) || new ApiError(500);
  const isServerFault = apiError.statusCode >= 500;

  // A stream that already started can't be given a status or a JSON body.
  // Express' built-in handler is the only thing that can close it cleanly.
  if (res.headersSent) {
    log.error({ err, event: "server.error" }, "Error raised after response started");
    return next(err);
  }

  if (isServerFault) {
    log.error({ err, event: "server.error", statusCode: apiError.statusCode }, err.message);
  } else {
    // Expected rejections are warnings, not errors — they need no stack, and
    // paging someone for a wrong password would be noise.
    log.warn(
      {
        event: eventFor(apiError.statusCode),
        statusCode: apiError.statusCode,
        errors: apiError.errors,
      },
      apiError.message
    );
  }

  const body = { success: false, message: apiError.message };
  if (apiError.errors) body.errors = apiError.errors;
  // Lets a bug report name one request out of the logs.
  if (req.id) body.requestId = String(req.id);
  if (!isProduction && isServerFault) body.stack = err.stack;

  res.status(apiError.statusCode).json(body);
};

module.exports = { notFound, errorHandler };
