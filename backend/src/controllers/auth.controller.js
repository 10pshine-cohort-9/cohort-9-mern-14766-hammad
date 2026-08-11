const authService = require("../services/auth.service");
const asyncHandler = require("../utils/asyncHandler");

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const data = await authService.register({ name, email, password });

  res.status(201).json({
    success: true,
    message: "Account created successfully",
    data,
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const data = await authService.login({ email, password });

  res.json({
    success: true,
    message: "Logged in successfully",
    data,
  });
});

// authenticate has already loaded the user, so there's nothing to look up.
const getMe = (req, res) => {
  res.json({
    success: true,
    message: "Profile retrieved successfully",
    data: { user: req.user.toJSON() },
  });
};

module.exports = { register, login, getMe };
