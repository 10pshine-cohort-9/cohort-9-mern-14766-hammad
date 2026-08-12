const express = require("express");

const {
  createNote,
  getNotes,
  getNote,
  updateNote,
  deleteNote,
} = require("../controllers/note.controller");
const validate = require("../middleware/validate");
const { authenticate } = require("../middleware/auth.middleware");
const {
  noteIdValidator,
  createNoteValidator,
  updateNoteValidator,
} = require("../validators/note.validator");

const router = express.Router();

// A note only ever belongs to one user, so there is no public route here.
router.use(authenticate);

router.post("/", createNoteValidator, validate, createNote);
router.get("/", getNotes);
router.get("/:id", noteIdValidator, validate, getNote);
router.patch("/:id", updateNoteValidator, validate, updateNote);
router.delete("/:id", noteIdValidator, validate, deleteNote);

module.exports = router;
