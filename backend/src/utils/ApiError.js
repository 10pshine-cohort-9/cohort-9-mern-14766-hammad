class ApiError extends Error {
  constructor(statusCode = 500, message = "Internal server error", errors) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    if (errors) this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
