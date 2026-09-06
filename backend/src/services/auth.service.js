const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const { signToken } = require("../utils/jwt");

const formatAuthPayload = (user) => ({
  user: user.toJSON(),
  token: signToken(user),
});

const register = async ({ name, email, password }) => {
  // The unique index is what actually prevents duplicates; this check just
  // turns the common case into a clean 409 instead of a driver error.
  if (await User.findOne({ email })) {
    throw new ApiError(409, "An account with that email already exists");
  }

  const user = await User.create({ name, email, password });

  return formatAuthPayload(user);
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");

  // Same message for both failures so this can't be used to find out
  // which emails are registered.
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  return formatAuthPayload(user);
};

module.exports = { register, login };
