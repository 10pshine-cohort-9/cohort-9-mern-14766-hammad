const { EventEmitter } = require("events");

const { expect } = require("chai");
const sinon = require("sinon");
const mongoose = require("mongoose");

const ApiError = require("../../src/utils/ApiError");

const objectId = () => new mongoose.Types.ObjectId();

/**
 * Stand-in for a Mongoose user document, carrying only the surface the code
 * under test touches. toJSON mirrors the real schema transform (_id becomes
 * id, password is dropped) so a test cannot pass here and fail in production.
 */
const fakeUser = (overrides = {}) => {
  const user = {
    _id: objectId(),
    name: "Ada Lovelace",
    email: "ada@example.com",
    role: "user",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };

  user.id = String(user._id);
  user.toJSON = () => ({
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
  user.comparePassword = sinon.stub().resolves(true);

  return user;
};

/**
 * Stand-in for a Mongoose note document. toJSON reads the fields live rather
 * than from a snapshot, so a service that mutates the document before
 * serializing it is observed accurately.
 */
const fakeNote = (overrides = {}) => {
  const note = {
    _id: objectId(),
    title: "First note",
    content: "Note body",
    user: objectId(),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };

  note.id = String(note._id);
  note.toJSON = () => ({
    id: String(note._id),
    title: note.title,
    content: note.content,
    user: String(note.user),
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  });
  note.save = sinon.stub().resolves(note);
  note.deleteOne = sinon.stub().resolves({ acknowledged: true, deletedCount: 1 });

  return note;
};

/** Every level the app logs at, stubbed. */
const fakeLog = () => ({
  trace: sinon.stub(),
  debug: sinon.stub(),
  info: sinon.stub(),
  warn: sinon.stub(),
  error: sinon.stub(),
  fatal: sinon.stub(),
});

const fakeReq = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  method: "GET",
  originalUrl: "/api/v1/notes",
  log: fakeLog(),
  ...overrides,
});

/**
 * Minimal Express response. Built on EventEmitter so a test can fire the
 * "finish" event that audit middleware listens for; status() chains the way
 * the real one does and json() records what was sent.
 */
const fakeRes = () => {
  const res = new EventEmitter();
  res.statusCode = 200;
  res.body = undefined;

  res.status = sinon.stub().callsFake((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = sinon.stub().callsFake((payload) => {
    res.body = payload;
    return res;
  });
  res.setHeader = sinon.stub();

  return res;
};

/**
 * Asserts that a promise rejects with an ApiError carrying the given status
 * (and message, when supplied), and hands the error back for further checks.
 * A plain try/catch would pass silently if the promise resolved.
 */
const expectApiError = async (promise, statusCode, message) => {
  let error;
  try {
    await promise;
  } catch (err) {
    error = err;
  }

  expect(error, "expected the promise to reject but it resolved").to.be.instanceOf(ApiError);
  expect(error.statusCode).to.equal(statusCode);
  if (message !== undefined) expect(error.message).to.equal(message);

  return error;
};

/** The error a middleware handed to next(), asserted to be an ApiError. */
const errorPassedTo = (next, statusCode, message) => {
  expect(next.calledOnce, "expected next() to be called exactly once").to.be.true;

  const [error] = next.firstCall.args;
  expect(error).to.be.instanceOf(ApiError);
  expect(error.statusCode).to.equal(statusCode);
  if (message !== undefined) expect(error.message).to.equal(message);

  return error;
};

/**
 * Runs an express-validator chain against a request object so validate() can
 * be unit tested without mounting a route.
 */
const runValidators = async (chain, req) => {
  for (const link of chain) await link.run(req);
};

module.exports = {
  objectId,
  fakeUser,
  fakeNote,
  fakeLog,
  fakeReq,
  fakeRes,
  expectApiError,
  errorPassedTo,
  runValidators,
};
