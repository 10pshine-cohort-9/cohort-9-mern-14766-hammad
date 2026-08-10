const { body } = require("express-validator");

// bcrypt ignores anything past 72 bytes, so reject longer instead of
// silently truncating.
const MAX_PASSWORD = 72;

const registerValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .bail()
    .normalizeEmail({ gmail_remove_dots: false }),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .bail()
    .isLength({ min: 8, max: MAX_PASSWORD })
    .withMessage(`Password must be between 8 and ${MAX_PASSWORD} characters`)
    .bail()
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .bail()
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .bail()
    .matches(/\d/)
    .withMessage("Password must contain at least one number"),
];

// No strength rules on login - the password either matches the hash or it doesn't.
const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .bail()
    .normalizeEmail({ gmail_remove_dots: false }),

  body("password").notEmpty().withMessage("Password is required"),
];

module.exports = { registerValidator, loginValidator };
