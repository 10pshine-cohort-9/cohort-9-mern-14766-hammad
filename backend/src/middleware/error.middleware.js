const ApiError = require("../utils/ApiError");
const logger = require("../config/logger");

const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// Turns the framework's error shapes into an ApiError so responses stay uniform.
const toApiError = (err) => {
  if (err instanceof ApiError) return err;

  if (err.name === "ValidationError") {
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

  if (err.name === "CastError") {
    return new ApiError(400, `Invalid value for ${err.path}`);
  }

  if (err.type === "entity.parse.failed") {
    return new ApiError(400, "Request body contains malformed JSON");
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
  const apiError = toApiError(err);
  // req.log is a child logger carrying the request id; the module logger is
  // only a fallback for an error raised before the http logger ran.
  const log = req.log || logger;

  // Anything unrecognised is a genuine bug: log the stack, but send back
  // something generic so we don't leak internals.
  if (!apiError) {
    log.error({ err, event: "server.error" }, `Unhandled error: ${err.message}`);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }

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

  const body = { success: false, message: apiError.message };
  if (apiError.errors) body.errors = apiError.errors;

  res.status(apiError.statusCode).json(body);
};

module.exports = { notFound, errorHandler };
