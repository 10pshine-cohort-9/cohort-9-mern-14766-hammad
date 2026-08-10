const express = require("express");

const { register, login, getMe } = require("../controllers/auth.controller");
const validate = require("../middleware/validate");
const { authenticate } = require("../middleware/auth.middleware");
const {
  registerValidator,
  loginValidator,
} = require("../validators/auth.validator");

const router = express.Router();

router.post("/register", registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);
router.get("/me", authenticate, getMe);

module.exports = router;
