const { expect } = require("chai");
const sinon = require("sinon");

const noteController = require("../../../src/controllers/note.controller");
const noteService = require("../../../src/services/note.service");
const ApiError = require("../../../src/utils/ApiError");
const { fakeReq, fakeRes, fakeUser, fakeNote, objectId } = require("../../helpers");

describe("controllers/note.controller", () => {
  let user;
  let res;
  let next;

  beforeEach(() => {
    user = fakeUser();
    res = fakeRes();
    next = sinon.stub();
  });

  const reqFor = (overrides = {}) => fakeReq({ user, ...overrides });

  describe("createNote", () => {
    const body = { title: "Groceries", content: "Milk" };

    it("answers 201 with the created note", async () => {
      const data = { note: fakeNote(body).toJSON() };
      sinon.stub(noteService, "createNote").resolves(data);

      await noteController.createNote(reqFor({ body }), res, next);

      expect(res.status.calledOnceWithExactly(201)).to.be.true;
      expect(res.body).to.deep.equal({
        success: true,
        message: "Note created successfully",
        data,
      });
    });

    // The owner comes from the verified token, never from the request body.
    it("takes the owner from req.user and ignores a userId in the body", async () => {
      const create = sinon.stub(noteService, "createNote").resolves({ note: {} });
      const someoneElse = String(objectId());

      await noteController.createNote(
        reqFor({ body: { ...body, userId: someoneElse } }),
        res,
        next
      );

      expect(create.calledOnceWithExactly({ userId: user.id, ...body })).to.be.true;
    });

    it("hands a validation rejection to next", async () => {
      const invalid = new ApiError(422, "Validation failed");
      sinon.stub(noteService, "createNote").rejects(invalid);

      await noteController.createNote(reqFor({ body }), res, next);

      expect(next.calledOnceWithExactly(invalid)).to.be.true;
      expect(res.json.called).to.be.false;
    });
  });

  describe("getNotes", () => {
    it("answers 200 with the caller's notes and a count", async () => {
      const data = { notes: [fakeNote().toJSON()], count: 1 };
      sinon.stub(noteService, "getNotes").resolves(data);

      await noteController.getNotes(reqFor(), res, next);

      expect(res.body).to.deep.equal({
        success: true,
        message: "Notes retrieved successfully",
        data,
      });
    });

    it("only ever asks for the authenticated user's notes", async () => {
      const getNotes = sinon.stub(noteService, "getNotes").resolves({ notes: [], count: 0 });

      await noteController.getNotes(reqFor(), res, next);

      expect(getNotes.calledOnceWithExactly({ userId: user.id })).to.be.true;
    });

    it("hands a service failure to next", async () => {
      const boom = new Error("database down");
      sinon.stub(noteService, "getNotes").rejects(boom);

      await noteController.getNotes(reqFor(), res, next);

      expect(next.calledOnceWithExactly(boom)).to.be.true;
    });
  });

  describe("getNote", () => {
    it("answers 200 with the note", async () => {
      const data = { note: fakeNote().toJSON() };
      sinon.stub(noteService, "getNote").resolves(data);

      await noteController.getNote(reqFor({ params: { id: data.note.id } }), res, next);

      expect(res.body).to.deep.equal({
        success: true,
        message: "Note retrieved successfully",
        data,
      });
    });

    it("pairs the id from the path with the owner from the token", async () => {
      const id = String(objectId());
      const getNote = sinon.stub(noteService, "getNote").resolves({ note: {} });

      await noteController.getNote(reqFor({ params: { id } }), res, next);

      expect(getNote.calledOnceWithExactly({ id, userId: user.id })).to.be.true;
    });

    it("hands a 404 to next", async () => {
      const notFound = new ApiError(404, "Note not found");
      sinon.stub(noteService, "getNote").rejects(notFound);

      await noteController.getNote(reqFor({ params: { id: String(objectId()) } }), res, next);

      expect(next.calledOnceWithExactly(notFound)).to.be.true;
      expect(res.json.called).to.be.false;
    });
  });

  describe("updateNote", () => {
    it("answers 200 with the updated note", async () => {
      const data = { note: fakeNote({ title: "New" }).toJSON() };
      sinon.stub(noteService, "updateNote").resolves(data);

      await noteController.updateNote(
        reqFor({ params: { id: data.note.id }, body: { title: "New" } }),
        res,
        next
      );

      expect(res.body).to.deep.equal({
        success: true,
        message: "Note updated successfully",
        data,
      });
    });

    it("passes the id, owner and both fields to the service", async () => {
      const id = String(objectId());
      const update = sinon.stub(noteService, "updateNote").resolves({ note: {} });

      await noteController.updateNote(
        reqFor({ params: { id }, body: { title: "New", content: "Body" } }),
        res,
        next
      );

      expect(
        update.calledOnceWithExactly({
          id,
          userId: user.id,
          title: "New",
          content: "Body",
        })
      ).to.be.true;
    });

    // The service uses `=== undefined` to decide what to touch, so an absent
    // field has to arrive as undefined rather than null or "".
    it("leaves an omitted field undefined", async () => {
      const id = String(objectId());
      const update = sinon.stub(noteService, "updateNote").resolves({ note: {} });

      await noteController.updateNote(
        reqFor({ params: { id }, body: { title: "New" } }),
        res,
        next
      );

      const args = update.firstCall.args[0];
      expect(args.title).to.equal("New");
      expect(args.content).to.be.undefined;
    });

    it("hands an empty update to next as the service's 422", async () => {
      const invalid = new ApiError(422, "Provide a title or content to update");
      sinon.stub(noteService, "updateNote").rejects(invalid);

      await noteController.updateNote(
        reqFor({ params: { id: String(objectId()) }, body: {} }),
        res,
        next
      );

      expect(next.calledOnceWithExactly(invalid)).to.be.true;
    });
  });

  describe("deleteNote", () => {
    it("answers 200 with a message and no data", async () => {
      sinon.stub(noteService, "deleteNote").resolves();

      await noteController.deleteNote(
        reqFor({ params: { id: String(objectId()) } }),
        res,
        next
      );

      expect(res.body).to.deep.equal({
        success: true,
        message: "Note deleted successfully",
      });
      expect(res.body).to.not.have.property("data");
    });

    it("pairs the id from the path with the owner from the token", async () => {
      const id = String(objectId());
      const remove = sinon.stub(noteService, "deleteNote").resolves();

      await noteController.deleteNote(reqFor({ params: { id } }), res, next);

      expect(remove.calledOnceWithExactly({ id, userId: user.id })).to.be.true;
    });

    it("hands a 404 to next", async () => {
      const notFound = new ApiError(404, "Note not found");
      sinon.stub(noteService, "deleteNote").rejects(notFound);

      await noteController.deleteNote(
        reqFor({ params: { id: String(objectId()) } }),
        res,
        next
      );

      expect(next.calledOnceWithExactly(notFound)).to.be.true;
      expect(res.json.called).to.be.false;
    });
  });
});
