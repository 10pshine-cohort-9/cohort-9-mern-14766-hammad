const { expect } = require("chai");
const sinon = require("sinon");

const Note = require("../../../src/models/note.model");
const noteService = require("../../../src/services/note.service");
const { fakeNote, objectId, expectApiError } = require("../../helpers");

describe("services/note.service", () => {
  let userId;

  beforeEach(() => {
    userId = objectId();
  });

  describe("createNote", () => {
    it("creates the note owned by the calling user", async () => {
      const note = fakeNote({ user: userId, title: "Groceries", content: "Milk" });
      const create = sinon.stub(Note, "create").resolves(note);

      const result = await noteService.createNote({
        userId,
        title: "Groceries",
        content: "Milk",
      });

      expect(
        create.calledOnceWithExactly({ user: userId, title: "Groceries", content: "Milk" })
      ).to.be.true;
      expect(result.note.title).to.equal("Groceries");
      expect(result.note.content).to.equal("Milk");
    });

    it("returns the note serialized through toJSON", async () => {
      const note = fakeNote({ user: userId });
      sinon.stub(Note, "create").resolves(note);

      const { note: serialized } = await noteService.createNote({
        userId,
        title: note.title,
        content: note.content,
      });

      expect(serialized.id).to.equal(String(note._id));
      expect(serialized).to.not.have.property("_id");
      expect(serialized).to.not.have.property("__v");
    });

    // Length and required-field rules live on the schema; errorHandler turns
    // the resulting ValidationError into a 422.
    it("lets a model validation error bubble up", async () => {
      const validationError = Object.assign(new Error("bad"), { name: "ValidationError" });
      sinon.stub(Note, "create").rejects(validationError);

      try {
        await noteService.createNote({ userId, title: "", content: "x" });
        expect.fail("expected createNote to reject");
      } catch (err) {
        expect(err).to.equal(validationError);
      }
    });
  });

  describe("getNotes", () => {
    const stubFind = (notes) => {
      const sort = sinon.stub().resolves(notes);
      const find = sinon.stub(Note, "find").returns({ sort });
      return { find, sort };
    };

    it("scopes the query to the owner and sorts newest first", async () => {
      const { find, sort } = stubFind([]);

      await noteService.getNotes({ userId });

      expect(find.calledOnceWithExactly({ user: userId })).to.be.true;
      expect(sort.calledOnceWithExactly({ createdAt: -1 })).to.be.true;
    });

    it("returns every note with a count", async () => {
      stubFind([fakeNote({ user: userId }), fakeNote({ user: userId })]);

      const { notes, count } = await noteService.getNotes({ userId });

      expect(notes).to.have.lengthOf(2);
      expect(count).to.equal(2);
      expect(notes[0]).to.have.property("id");
    });

    it("returns an empty list rather than an error when there are none", async () => {
      stubFind([]);

      const { notes, count } = await noteService.getNotes({ userId });

      expect(notes).to.deep.equal([]);
      expect(count).to.equal(0);
    });
  });

  describe("getNote", () => {
    it("returns a note the caller owns", async () => {
      const note = fakeNote({ user: userId });
      sinon.stub(Note, "findOne").resolves(note);

      const result = await noteService.getNote({ id: String(note._id), userId });

      expect(result.note.id).to.equal(String(note._id));
    });

    // The owner is part of the filter, not checked afterwards, so another
    // account's note is never even loaded.
    it("filters on the owner as well as the id", async () => {
      const id = String(objectId());
      const findOne = sinon.stub(Note, "findOne").resolves(fakeNote({ user: userId }));

      await noteService.getNote({ id, userId });

      expect(findOne.calledOnceWithExactly({ _id: id, user: userId })).to.be.true;
    });

    it("reports a note belonging to someone else as 404, not 403", async () => {
      sinon.stub(Note, "findOne").resolves(null);

      await expectApiError(
        noteService.getNote({ id: String(objectId()), userId }),
        404,
        "Note not found"
      );
    });
  });

  describe("updateNote", () => {
    it("rejects an update that changes nothing with 422", async () => {
      const findOne = sinon.stub(Note, "findOne");

      await expectApiError(
        noteService.updateNote({ id: String(objectId()), userId }),
        422,
        "Provide a title or content to update"
      );

      expect(findOne.called, "must not hit the database first").to.be.false;
    });

    it("updates only the title when only a title is given", async () => {
      const note = fakeNote({ user: userId, title: "Old", content: "Body" });
      sinon.stub(Note, "findOne").resolves(note);

      const { note: updated } = await noteService.updateNote({
        id: String(note._id),
        userId,
        title: "New",
      });

      expect(updated.title).to.equal("New");
      expect(updated.content).to.equal("Body");
    });

    it("updates only the content when only content is given", async () => {
      const note = fakeNote({ user: userId, title: "Old", content: "Body" });
      sinon.stub(Note, "findOne").resolves(note);

      const { note: updated } = await noteService.updateNote({
        id: String(note._id),
        userId,
        content: "New body",
      });

      expect(updated.title).to.equal("Old");
      expect(updated.content).to.equal("New body");
    });

    it("updates both fields when both are given", async () => {
      const note = fakeNote({ user: userId, title: "Old", content: "Body" });
      sinon.stub(Note, "findOne").resolves(note);

      const { note: updated } = await noteService.updateNote({
        id: String(note._id),
        userId,
        title: "New",
        content: "New body",
      });

      expect(updated.title).to.equal("New");
      expect(updated.content).to.equal("New body");
    });

    // save() rather than findOneAndUpdate(), so schema validators and the
    // updatedAt timestamp behave the same as on create.
    it("persists with save()", async () => {
      const note = fakeNote({ user: userId });
      sinon.stub(Note, "findOne").resolves(note);

      await noteService.updateNote({ id: String(note._id), userId, title: "New" });

      expect(note.save.calledOnce).to.be.true;
    });

    it("scopes the lookup to the owner", async () => {
      const note = fakeNote({ user: userId });
      const findOne = sinon.stub(Note, "findOne").resolves(note);

      await noteService.updateNote({ id: String(note._id), userId, title: "New" });

      expect(findOne.calledOnceWithExactly({ _id: String(note._id), user: userId })).to.be
        .true;
    });

    it("refuses to update another account's note with 404", async () => {
      sinon.stub(Note, "findOne").resolves(null);

      await expectApiError(
        noteService.updateNote({ id: String(objectId()), userId, title: "New" }),
        404,
        "Note not found"
      );
    });

    it("lets a validation error from save() bubble up", async () => {
      const note = fakeNote({ user: userId });
      const validationError = Object.assign(new Error("too long"), {
        name: "ValidationError",
      });
      note.save.rejects(validationError);
      sinon.stub(Note, "findOne").resolves(note);

      try {
        await noteService.updateNote({ id: String(note._id), userId, title: "x".repeat(200) });
        expect.fail("expected updateNote to reject");
      } catch (err) {
        expect(err).to.equal(validationError);
      }
    });
  });

  describe("deleteNote", () => {
    it("deletes a note the caller owns", async () => {
      const note = fakeNote({ user: userId });
      sinon.stub(Note, "findOne").resolves(note);

      await noteService.deleteNote({ id: String(note._id), userId });

      expect(note.deleteOne.calledOnce).to.be.true;
    });

    it("scopes the lookup to the owner", async () => {
      const note = fakeNote({ user: userId });
      const findOne = sinon.stub(Note, "findOne").resolves(note);

      await noteService.deleteNote({ id: String(note._id), userId });

      expect(findOne.calledOnceWithExactly({ _id: String(note._id), user: userId })).to.be
        .true;
    });

    it("resolves with nothing — the controller sends a message only", async () => {
      const note = fakeNote({ user: userId });
      sinon.stub(Note, "findOne").resolves(note);

      const result = await noteService.deleteNote({ id: String(note._id), userId });

      expect(result).to.be.undefined;
    });

    it("refuses to delete another account's note with 404", async () => {
      sinon.stub(Note, "findOne").resolves(null);

      await expectApiError(
        noteService.deleteNote({ id: String(objectId()), userId }),
        404,
        "Note not found"
      );
    });

    it("does not delete anything when the note is not found", async () => {
      const note = fakeNote({ user: userId });
      sinon.stub(Note, "findOne").resolves(null);

      await expectApiError(noteService.deleteNote({ id: String(note._id), userId }), 404);

      expect(note.deleteOne.called).to.be.false;
    });
  });
});
