const jwt = require("jsonwebtoken");

const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { verifyToken } = require("../utils/jwt");

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (!/^Bearer$/i.test(scheme) || !token) {
    throw new ApiError(401, "Authentication required");
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, "Token has expired, please log in again");
    }
    throw new ApiError(401, "Invalid authentication token");
  }

  // Re-read the user each request so a deleted account stops working
  // straight away instead of when its token expires.
  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, "This user no longer exists");

  req.user = user;

  // Rejections are logged once, centrally, by errorHandler. Only the accepted
  // case needs a line here, and it is debug because the response log already
  // carries the userId.
  req.log.debug(
    { event: "auth.token.accepted", userId: String(user.id), role: user.role },
    "Token accepted"
  );

  next();
});

const authorize =
  (...roles) =>
  (req, res, next) => {
    // Guards against being mounted without authenticate ahead of it, which
    // would otherwise read role off undefined and report a routing mistake
    // as a 500 instead of the 401 it really is.
    if (!req.user) return next(new ApiError(401, "Authentication required"));

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to do that"));
    }
    next();
  };

module.exports = { authenticate, authorize };
