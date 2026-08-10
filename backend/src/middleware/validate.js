const { validationResult } = require("express-validator");

const ApiError = require("../utils/ApiError");

// Reports every bad field at once instead of one per round trip.
module.exports = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  next(new ApiError(422, "Validation failed", errors));
};
