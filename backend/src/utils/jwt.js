const jwt = require("jsonwebtoken");

const { jwtSecret, jwtExpiresIn } = require("../config/env");

// Only the id and role go in the payload - anything else would go stale
// as soon as the user edits their profile.
const signToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, jwtSecret, {
    expiresIn: jwtExpiresIn,
  });

const verifyToken = (token) => jwt.verify(token, jwtSecret);

module.exports = { signToken, verifyToken };
