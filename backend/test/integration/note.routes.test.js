const { expect } = require("chai");
const sinon = require("sinon");
const request = require("supertest");

const app = require("../../src/app");
const User = require("../../src/models/user.model");
const Note = require("../../src/models/note.model");
const { signToken } = require("../../src/utils/jwt");
const { fakeUser, fakeNote, objectId } = require("../helpers");

describe("notes routes", () => {
  let user;
  let token;

  beforeEach(() => {
    user = fakeUser();
    token = signToken(user);
    // authenticate() re-reads the account on every request.
    sinon.stub(User, "findById").resolves(user);
  });

  const authed = (method, path) =>
    request(app)[method](path).set("Authorization", `Bearer ${token}`);

  describe("POST /api/v1/notes", () => {
    const payload = { title: "Groceries", content: "Milk, eggs, bread" };

    it("creates the note and answers 201", async () => {
      const note = fakeNote({ ...payload, user: user._id });
      const create = sinon.stub(Note, "create").resolves(note);

      const res = await authed("post", "/api/v1/notes").send(payload);

      expect(res.status).to.equal(201);
      expect(res.body.message).to.equal("Note created successfully");
      expect(res.body.data.note).to.deep.include({
        id: String(note._id),
        title: "Groceries",
        content: "Milk, eggs, bread",
      });
      expect(create.calledOnce).to.be.true;
    });

    // The owner comes from the verified token, never from the request body.
    it("owns the note to the authenticated user", async () => {
      const create = sinon.stub(Note, "create").resolves(fakeNote({ user: user._id }));

      await authed("post", "/api/v1/notes").send(payload);

      expect(String(create.firstCall.args[0].user)).to.equal(String(user._id));
    });

    it("ignores an owner smuggled into the body", async () => {
      const create = sinon.stub(Note, "create").resolves(fakeNote({ user: user._id }));
      const someoneElse = String(objectId());

      await authed("post", "/api/v1/notes").send({
        ...payload,
        user: someoneElse,
        userId: someoneElse,
      });

      expect(String(create.firstCall.args[0].user)).to.equal(String(user._id));
      expect(String(create.firstCall.args[0].user)).to.not.equal(someoneElse);
    });

    it("requires a title and content", async () => {
      const res = await authed("post", "/api/v1/notes").send({});

      expect(res.status).to.equal(422);
      expect(res.body.errors).to.deep.include.members([
        { field: "title", message: "Title is required" },
        { field: "content", message: "Content is required" },
      ]);
    });

    it("rejects a whitespace-only title", async () => {
      const res = await authed("post", "/api/v1/notes").send({ ...payload, title: "   " });

      expect(res.status).to.equal(422);
      expect(res.body.errors).to.deep.include({
        field: "title",
        message: "Title is required",
      });
    });

    it("rejects a title over 120 characters", async () => {
      const res = await authed("post", "/api/v1/notes").send({
        ...payload,
        title: "a".repeat(121),
      });

      expect(res.status).to.equal(422);
      expect(res.body.errors).to.deep.include({
        field: "title",
        message: "Title must not exceed 120 characters",
      });
    });

    it("maps a schema validation failure to a 422 with field detail", async () => {
      sinon.stub(Note, "create").rejects(
        Object.assign(new Error("Note validation failed"), {
          name: "ValidationError",
          errors: { title: { path: "title", message: "Title is required" } },
        })
      );

      const res = await authed("post", "/api/v1/notes").send(payload);

      expect(res.status).to.equal(422);
      expect(res.body.errors).to.deep.equal([
        { field: "title", message: "Title is required" },
      ]);
    });
  });

  describe("GET /api/v1/notes", () => {
    it("returns the caller's notes with a count", async () => {
      const notes = [fakeNote({ user: user._id }), fakeNote({ user: user._id })];
      sinon.stub(Note, "find").returns({ sort: sinon.stub().resolves(notes) });

      const res = await authed("get", "/api/v1/notes");

      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal("Notes retrieved successfully");
      expect(res.body.data.notes).to.have.lengthOf(2);
      expect(res.body.data.count).to.equal(2);
    });

    it("only ever queries the caller's own notes", async () => {
      const find = sinon.stub(Note, "find").returns({ sort: sinon.stub().resolves([]) });

      await authed("get", "/api/v1/notes");

      expect(String(find.firstCall.args[0].user)).to.equal(String(user._id));
    });

    it("returns an empty list when there are none", async () => {
      sinon.stub(Note, "find").returns({ sort: sinon.stub().resolves([]) });

      const res = await authed("get", "/api/v1/notes");

      expect(res.status).to.equal(200);
      expect(res.body.data).to.deep.equal({ notes: [], count: 0 });
    });
  });

  describe("GET /api/v1/notes/:id", () => {
    it("returns a note the caller owns", async () => {
      const note = fakeNote({ user: user._id });
      sinon.stub(Note, "findOne").resolves(note);

      const res = await authed("get", `/api/v1/notes/${note._id}`);

      expect(res.status).to.equal(200);
      expect(res.body.data.note.id).to.equal(String(note._id));
    });

    it("rejects an id that is not an ObjectId before touching the database", async () => {
      const findOne = sinon.stub(Note, "findOne");

      const res = await authed("get", "/api/v1/notes/not-an-id");

      expect(res.status).to.equal(422);
      expect(res.body.errors).to.deep.equal([
        { field: "id", message: "Note id is not a valid identifier" },
      ]);
      expect(findOne.called).to.be.false;
    });

    it("answers 404 when the note does not exist", async () => {
      sinon.stub(Note, "findOne").resolves(null);

      const res = await authed("get", `/api/v1/notes/${objectId()}`);

      expect(res.status).to.equal(404);
      expect(res.body).to.deep.equal({ success: false, message: "Note not found" });
    });
  });

  describe("PATCH /api/v1/notes/:id", () => {
    it("updates the title and answers 200", async () => {
      const note = fakeNote({ user: user._id, title: "Old", content: "Body" });
      sinon.stub(Note, "findOne").resolves(note);

      const res = await authed("patch", `/api/v1/notes/${note._id}`).send({ title: "New" });

      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal("Note updated successfully");
      expect(res.body.data.note.title).to.equal("New");
      expect(res.body.data.note.content).to.equal("Body");
      expect(note.save.calledOnce).to.be.true;
    });

    it("updates the content only", async () => {
      const note = fakeNote({ user: user._id, title: "Old", content: "Body" });
      sinon.stub(Note, "findOne").resolves(note);

      const res = await authed("patch", `/api/v1/notes/${note._id}`).send({
        content: "New body",
      });

      expect(res.status).to.equal(200);
      expect(res.body.data.note.title).to.equal("Old");
      expect(res.body.data.note.content).to.equal("New body");
    });

    it("updates both fields at once", async () => {
      const note = fakeNote({ user: user._id });
      sinon.stub(Note, "findOne").resolves(note);

      const res = await authed("patch", `/api/v1/notes/${note._id}`).send({
        title: "New",
        content: "New body",
      });

      expect(res.status).to.equal(200);
      expect(res.body.data.note).to.deep.include({ title: "New", content: "New body" });
    });

    // Both fields are optional, but sending neither is a no-op request and
    // almost always a mistake.
    it("rejects an update that changes nothing with 422", async () => {
      const findOne = sinon.stub(Note, "findOne");

      const res = await authed("patch", `/api/v1/notes/${objectId()}`).send({});

      expect(res.status).to.equal(422);
      expect(res.body.message).to.equal("Provide a title or content to update");
      expect(findOne.called).to.be.false;
    });

    it("rejects an explicitly empty title", async () => {
      const res = await authed("patch", `/api/v1/notes/${objectId()}`).send({ title: "" });

      expect(res.status).to.equal(422);
      expect(res.body.errors).to.deep.include({
        field: "title",
        message: "Title must not be empty",
      });
    });

    it("rejects an explicitly empty content", async () => {
      const res = await authed("patch", `/api/v1/notes/${objectId()}`).send({ content: "  " });

      expect(res.status).to.equal(422);
      expect(res.body.errors).to.deep.include({
        field: "content",
        message: "Content must not be empty",
      });
    });

    it("rejects an id that is not an ObjectId", async () => {
      const res = await authed("patch", "/api/v1/notes/not-an-id").send({ title: "New" });

      expect(res.status).to.equal(422);
      expect(res.body.errors).to.deep.include({
        field: "id",
        message: "Note id is not a valid identifier",
      });
    });

    it("answers 404 when the note does not exist", async () => {
      sinon.stub(Note, "findOne").resolves(null);

      const res = await authed("patch", `/api/v1/notes/${objectId()}`).send({ title: "New" });

      expect(res.status).to.equal(404);
      expect(res.body.message).to.equal("Note not found");
    });
  });

  describe("DELETE /api/v1/notes/:id", () => {
    it("deletes the note and answers 200 with no data", async () => {
      const note = fakeNote({ user: user._id });
      sinon.stub(Note, "findOne").resolves(note);

      const res = await authed("delete", `/api/v1/notes/${note._id}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal({
        success: true,
        message: "Note deleted successfully",
      });
      expect(note.deleteOne.calledOnce).to.be.true;
    });

    it("rejects an id that is not an ObjectId", async () => {
      const res = await authed("delete", "/api/v1/notes/not-an-id");

      expect(res.status).to.equal(422);
      expect(res.body.errors).to.deep.include({
        field: "id",
        message: "Note id is not a valid identifier",
      });
    });

    it("answers 404 when the note does not exist", async () => {
      sinon.stub(Note, "findOne").resolves(null);

      const res = await authed("delete", `/api/v1/notes/${objectId()}`);

      expect(res.status).to.equal(404);
      expect(res.body.message).to.equal("Note not found");
    });

    it("is idempotent from the caller's point of view — a second delete is 404", async () => {
      const findOne = sinon.stub(Note, "findOne");
      const note = fakeNote({ user: user._id });
      findOne.onFirstCall().resolves(note);
      findOne.onSecondCall().resolves(null);

      const first = await authed("delete", `/api/v1/notes/${note._id}`);
      const second = await authed("delete", `/api/v1/notes/${note._id}`);

      expect(first.status).to.equal(200);
      expect(second.status).to.equal(404);
    });
  });
});
