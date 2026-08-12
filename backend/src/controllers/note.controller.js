const noteService = require("../services/note.service");
const asyncHandler = require("../utils/asyncHandler");

const createNote = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  const data = await noteService.createNote({
    userId: req.user.id,
    title,
    content,
  });

  res.status(201).json({
    success: true,
    message: "Note created successfully",
    data,
  });
});

const getNotes = asyncHandler(async (req, res) => {
  const data = await noteService.getNotes({ userId: req.user.id });

  res.json({
    success: true,
    message: "Notes retrieved successfully",
    data,
  });
});

const getNote = asyncHandler(async (req, res) => {
  const data = await noteService.getNote({
    id: req.params.id,
    userId: req.user.id,
  });

  res.json({
    success: true,
    message: "Note retrieved successfully",
    data,
  });
});

const updateNote = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  const data = await noteService.updateNote({
    id: req.params.id,
    userId: req.user.id,
    title,
    content,
  });

  res.json({
    success: true,
    message: "Note updated successfully",
    data,
  });
});

const deleteNote = asyncHandler(async (req, res) => {
  await noteService.deleteNote({ id: req.params.id, userId: req.user.id });

  res.json({
    success: true,
    message: "Note deleted successfully",
  });
});

module.exports = { createNote, getNotes, getNote, updateNote, deleteNote };
