const { expect } = require("chai");
const sinon = require("sinon");

const noteController = require("../../../src/controllers/note.controller");
const noteService = require("../../../src/services/note.service");

describe("Note Controller Unit Tests", () => {
  let sandbox;
  let req;
  let res;

  const userId = "507f191e810c19729de860ea";
  const noteId = "607f191e810c19729de860eb";

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      body: {},
      params: {},
      user: { id: userId },
    };

    res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.stub().returnsThis(),
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("createNote()", () => {
    it("should call noteService.createNote and return 201 response", async () => {
      req.body = { title: "New Note", content: "Content" };
      const mockResult = { note: { id: noteId, title: "New Note", content: "Content" } };

      sandbox.stub(noteService, "createNote").resolves(mockResult);

      await noteController.createNote(req, res);

      expect(noteService.createNote.calledOnceWith({
        userId,
        title: "New Note",
        content: "Content",
      })).to.be.true;
      expect(res.status.calledOnceWith(201)).to.be.true;
      expect(res.json.calledOnceWith({
        success: true,
        message: "Note created successfully",
        data: mockResult,
      })).to.be.true;
    });
  });

  describe("getNotes()", () => {
    it("should call noteService.getNotes and return 200 response with list", async () => {
      const mockResult = { notes: [{ id: noteId, title: "Note 1" }], count: 1 };

      sandbox.stub(noteService, "getNotes").resolves(mockResult);

      await noteController.getNotes(req, res);

      expect(noteService.getNotes.calledOnceWith({ userId })).to.be.true;
      expect(res.json.calledOnceWith({
        success: true,
        message: "Notes retrieved successfully",
        data: mockResult,
      })).to.be.true;
    });
  });

  describe("getNote()", () => {
    it("should call noteService.getNote and return note data", async () => {
      req.params.id = noteId;
      const mockResult = { note: { id: noteId, title: "Found Note" } };

      sandbox.stub(noteService, "getNote").resolves(mockResult);

      await noteController.getNote(req, res);

      expect(noteService.getNote.calledOnceWith({ id: noteId, userId })).to.be.true;
      expect(res.json.calledOnceWith({
        success: true,
        message: "Note retrieved successfully",
        data: mockResult,
      })).to.be.true;
    });
  });

  describe("updateNote()", () => {
    it("should call noteService.updateNote and return updated note data", async () => {
      req.params.id = noteId;
      req.body = { title: "Updated Title", content: "Updated Content" };
      const mockResult = { note: { id: noteId, title: "Updated Title", content: "Updated Content" } };

      sandbox.stub(noteService, "updateNote").resolves(mockResult);

      await noteController.updateNote(req, res);

      expect(noteService.updateNote.calledOnceWith({
        id: noteId,
        userId,
        title: "Updated Title",
        content: "Updated Content",
      })).to.be.true;
      expect(res.json.calledOnceWith({
        success: true,
        message: "Note updated successfully",
        data: mockResult,
      })).to.be.true;
    });
  });

  describe("deleteNote()", () => {
    it("should call noteService.deleteNote and return success message", async () => {
      req.params.id = noteId;

      sandbox.stub(noteService, "deleteNote").resolves();

      await noteController.deleteNote(req, res);

      expect(noteService.deleteNote.calledOnceWith({ id: noteId, userId })).to.be.true;
      expect(res.json.calledOnceWith({
        success: true,
        message: "Note deleted successfully",
      })).to.be.true;
    });
  });
});
