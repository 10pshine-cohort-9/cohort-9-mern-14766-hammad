const { body, param } = require("express-validator");

// Kept in step with the schema's maxlength so a rejection is a 422 from here
// rather than a 422 from Mongoose after a round trip.
const MAX_TITLE = 120;
const MAX_CONTENT = 10000;

const noteIdValidator = [
  param("id").isMongoId().withMessage("Note id is not a valid identifier"),
];

const createNoteValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .bail()
    .isLength({ max: MAX_TITLE })
    .withMessage(`Title must not exceed ${MAX_TITLE} characters`),

  body("content")
    .trim()
    .notEmpty()
    .withMessage("Content is required")
    .bail()
    .isLength({ max: MAX_CONTENT })
    .withMessage(`Content must not exceed ${MAX_CONTENT} characters`),
];

// Both fields are optional on update, but sending neither is a no-op request
// and almost always a mistake, so the service rejects that case.
const updateNoteValidator = [
  ...noteIdValidator,

  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title must not be empty")
    .bail()
    .isLength({ max: MAX_TITLE })
    .withMessage(`Title must not exceed ${MAX_TITLE} characters`),

  body("content")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Content must not be empty")
    .bail()
    .isLength({ max: MAX_CONTENT })
    .withMessage(`Content must not exceed ${MAX_CONTENT} characters`),
];

module.exports = { noteIdValidator, createNoteValidator, updateNoteValidator };
