const ApiError = require("../utils/ApiError");

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

const errorHandler = (err, req, res, next) => {
  const apiError = toApiError(err);

  // Anything unrecognised is a genuine bug: log the stack, but send back
  // something generic so we don't leak internals.
  if (!apiError) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }

  const body = { success: false, message: apiError.message };
  if (apiError.errors) body.errors = apiError.errors;

  res.status(apiError.statusCode).json(body);
};

module.exports = { notFound, errorHandler };
