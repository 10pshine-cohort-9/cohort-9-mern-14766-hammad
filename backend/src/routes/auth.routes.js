const express = require("express");

const { register, login, getMe } = require("../controllers/auth.controller");
const validate = require("../middleware/validate");
const audit = require("../middleware/audit.middleware");
const { authenticate } = require("../middleware/auth.middleware");
const {
  registerValidator,
  loginValidator,
} = require("../validators/auth.validator");

const router = express.Router();

router.post("/register", audit("auth.register"), registerValidator, validate, register);
router.post("/login", audit("auth.login"), loginValidator, validate, login);
router.get("/me", audit("auth.profile.read"), authenticate, getMe);

module.exports = router;
