const { expect } = require("chai");
const sinon = require("sinon");

const noteService = require("../../../src/services/note.service");
const Note = require("../../../src/models/note.model");
const ApiError = require("../../../src/utils/ApiError");

describe("Note Service Unit Tests", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  const userId = "507f191e810c19729de860ea";
  const noteId = "607f191e810c19729de860eb";

  describe("createNote()", () => {
    it("should create a note and return formatted note data", async () => {
      const payload = {
        userId,
        title: "Test Note",
        content: "This is a test note content",
      };

      const createdNoteDoc = {
        _id: noteId,
        user: userId,
        title: payload.title,
        content: payload.content,
        toJSON: () => ({
          id: noteId,
          user: userId,
          title: payload.title,
          content: payload.content,
        }),
      };

      sandbox.stub(Note, "create").resolves(createdNoteDoc);

      const result = await noteService.createNote(payload);

      expect(Note.create.calledOnceWith({ user: userId, title: payload.title, content: payload.content })).to.be.true;
      expect(result).to.deep.equal({
        note: {
          id: noteId,
          user: userId,
          title: payload.title,
          content: payload.content,
        },
      });
    });
  });

  describe("getNotes()", () => {
    it("should fetch all notes owned by user and return count", async () => {
      const mockNotes = [
        {
          toJSON: () => ({ id: "1", title: "Note 1", content: "Content 1" }),
        },
        {
          toJSON: () => ({ id: "2", title: "Note 2", content: "Content 2" }),
        },
      ];

      const queryStub = {
        sort: sandbox.stub().resolves(mockNotes),
      };
      sandbox.stub(Note, "find").returns(queryStub);

      const result = await noteService.getNotes({ userId });

      expect(Note.find.calledOnceWith({ user: userId })).to.be.true;
      expect(queryStub.sort.calledOnceWith({ createdAt: -1 })).to.be.true;
      expect(result).to.deep.equal({
        notes: [
          { id: "1", title: "Note 1", content: "Content 1" },
          { id: "2", title: "Note 2", content: "Content 2" },
        ],
        count: 2,
      });
    });
  });

  describe("getNote()", () => {
    it("should return a single note if owned by the user", async () => {
      const mockNote = {
        _id: noteId,
        user: userId,
        title: "Single Note",
        content: "Single Content",
        toJSON: () => ({ id: noteId, title: "Single Note", content: "Single Content" }),
      };

      sandbox.stub(Note, "findOne").resolves(mockNote);

      const result = await noteService.getNote({ id: noteId, userId });

      expect(Note.findOne.calledOnceWith({ _id: noteId, user: userId })).to.be.true;
      expect(result).to.deep.equal({
        note: { id: noteId, title: "Single Note", content: "Single Content" },
      });
    });

    it("should throw 404 ApiError if note is not found or owned by another user", async () => {
      sandbox.stub(Note, "findOne").resolves(null);

      try {
        await noteService.getNote({ id: noteId, userId });
        expect.fail("Expected getNote to throw ApiError");
      } catch (err) {
        expect(err).to.be.instanceOf(ApiError);
        expect(err.statusCode).to.equal(404);
        expect(err.message).to.equal("Note not found");
      }
    });
  });

  describe("updateNote()", () => {
    it("should update note title and content successfully", async () => {
      const mockNoteDoc = {
        _id: noteId,
        user: userId,
        title: "Old Title",
        content: "Old Content",
        save: sandbox.stub().resolves(),
        toJSON: function () {
          return {
            id: this._id,
            title: this.title,
            content: this.content,
          };
        },
      };

      sandbox.stub(Note, "findOne").resolves(mockNoteDoc);

      const result = await noteService.updateNote({
        id: noteId,
        userId,
        title: "Updated Title",
        content: "Updated Content",
      });

      expect(mockNoteDoc.title).to.equal("Updated Title");
      expect(mockNoteDoc.content).to.equal("Updated Content");
      expect(mockNoteDoc.save.calledOnce).to.be.true;
      expect(result).to.deep.equal({
        note: {
          id: noteId,
          title: "Updated Title",
          content: "Updated Content",
        },
      });
    });

    it("should throw 422 ApiError if neither title nor content is provided", async () => {
      try {
        await noteService.updateNote({ id: noteId, userId });
        expect.fail("Expected updateNote to throw 422 ApiError");
      } catch (err) {
        expect(err).to.be.instanceOf(ApiError);
        expect(err.statusCode).to.equal(422);
        expect(err.message).to.equal("Provide a title or content to update");
      }
    });

    it("should throw 404 ApiError if note to update does not exist", async () => {
      sandbox.stub(Note, "findOne").resolves(null);

      try {
        await noteService.updateNote({
          id: noteId,
          userId,
          title: "New Title",
        });
        expect.fail("Expected updateNote to throw 404 ApiError");
      } catch (err) {
        expect(err).to.be.instanceOf(ApiError);
        expect(err.statusCode).to.equal(404);
        expect(err.message).to.equal("Note not found");
      }
    });
  });

  describe("deleteNote()", () => {
    it("should delete note if owned by user", async () => {
      const mockNoteDoc = {
        _id: noteId,
        user: userId,
        deleteOne: sandbox.stub().resolves(),
      };

      sandbox.stub(Note, "findOne").resolves(mockNoteDoc);

      await noteService.deleteNote({ id: noteId, userId });

      expect(Note.findOne.calledOnceWith({ _id: noteId, user: userId })).to.be.true;
      expect(mockNoteDoc.deleteOne.calledOnce).to.be.true;
    });

    it("should throw 404 ApiError if note to delete does not exist", async () => {
      sandbox.stub(Note, "findOne").resolves(null);

      try {
        await noteService.deleteNote({ id: noteId, userId });
        expect.fail("Expected deleteNote to throw 404 ApiError");
      } catch (err) {
        expect(err).to.be.instanceOf(ApiError);
        expect(err.statusCode).to.equal(404);
        expect(err.message).to.equal("Note not found");
      }
    });
  });
});
