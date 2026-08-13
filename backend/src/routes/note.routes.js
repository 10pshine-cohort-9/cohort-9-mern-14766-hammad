const express = require("express");

const {
  createNote,
  getNotes,
  getNote,
  updateNote,
  deleteNote,
} = require("../controllers/note.controller");
const validate = require("../middleware/validate");
const audit = require("../middleware/audit.middleware");
const { authenticate } = require("../middleware/auth.middleware");
const {
  noteIdValidator,
  createNoteValidator,
  updateNoteValidator,
} = require("../validators/note.validator");

const router = express.Router();

// A note only ever belongs to one user, so there is no public route here.
router.use(authenticate);

router.post("/", audit("note.create"), createNoteValidator, validate, createNote);
router.get("/", audit("note.list"), getNotes);
router.get("/:id", audit("note.read"), noteIdValidator, validate, getNote);
router.patch("/:id", audit("note.update"), updateNoteValidator, validate, updateNote);
router.delete("/:id", audit("note.delete"), noteIdValidator, validate, deleteNote);

module.exports = router;
