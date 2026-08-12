const Note = require("../models/note.model");
const ApiError = require("../utils/ApiError");

// Every lookup is filtered by owner as well as id. A note belonging to someone
// else is reported as missing rather than forbidden, so this can't be used to
// probe for note ids that exist on other accounts.
const findOwned = async (id, userId) => {
  const note = await Note.findOne({ _id: id, user: userId });
  if (!note) throw new ApiError(404, "Note not found");
  return note;
};

const createNote = async ({ userId, title, content }) => {
  const note = await Note.create({ user: userId, title, content });
  return { note: note.toJSON() };
};

const getNotes = async ({ userId }) => {
  const notes = await Note.find({ user: userId }).sort({ createdAt: -1 });
  return { notes: notes.map((note) => note.toJSON()), count: notes.length };
};

const getNote = async ({ id, userId }) => {
  const note = await findOwned(id, userId);
  return { note: note.toJSON() };
};

const updateNote = async ({ id, userId, title, content }) => {
  if (title === undefined && content === undefined) {
    throw new ApiError(422, "Provide a title or content to update");
  }

  const note = await findOwned(id, userId);

  if (title !== undefined) note.title = title;
  if (content !== undefined) note.content = content;

  // save() rather than findOneAndUpdate() so schema validators and the
  // updatedAt timestamp both run the same way they do on create.
  await note.save();

  return { note: note.toJSON() };
};

const deleteNote = async ({ id, userId }) => {
  const note = await findOwned(id, userId);
  await note.deleteOne();
};

module.exports = { createNote, getNotes, getNote, updateNote, deleteNote };
