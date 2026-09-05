import apiClient from '../api/axios';
import { loginApi, registerApi, getMeApi } from '../api/auth.api';
import {
  getNotesApi,
  createNoteApi,
  updateNoteApi,
  deleteNoteApi,
} from '../api/notes.api';

jest.mock('../api/axios');

describe('API Services (Mock API Requests)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Auth API Services', () => {
    it('loginApi sends POST request to /auth/login with credentials and returns data', async () => {
      const credentials = { email: 'user@example.com', password: 'Password123!' };
      const responsePayload = {
        data: {
          success: true,
          message: 'Login successful',
          data: { user: { id: '1', name: 'Test User' }, token: 'fake-jwt-token' },
        },
      };

      apiClient.post.mockResolvedValueOnce(responsePayload);

      const result = await loginApi(credentials);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(result).toEqual(responsePayload.data);
    });

    it('registerApi sends POST request to /auth/register with user data and returns data', async () => {
      const userData = {
        name: 'Test User',
        email: 'user@example.com',
        password: 'Password123!',
      };
      const responsePayload = {
        data: {
          success: true,
          message: 'User registered successfully',
          data: { user: { id: '1', name: 'Test User' }, token: 'fake-jwt-token' },
        },
      };

      apiClient.post.mockResolvedValueOnce(responsePayload);

      const result = await registerApi(userData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', userData);
      expect(result).toEqual(responsePayload.data);
    });

    it('getMeApi sends GET request to /auth/me and returns user session profile', async () => {
      const responsePayload = {
        data: {
          success: true,
          data: { user: { id: '1', name: 'Test User', email: 'user@example.com' } },
        },
      };

      apiClient.get.mockResolvedValueOnce(responsePayload);

      const result = await getMeApi();

      expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(responsePayload.data);
    });
  });

  describe('Notes API Services', () => {
    it('getNotesApi sends GET request to /notes', async () => {
      const responsePayload = {
        data: {
          notes: [
            { _id: 'note-1', title: 'Note 1', content: '<p>Content 1</p>' },
            { _id: 'note-2', title: 'Note 2', content: '<p>Content 2</p>' },
          ],
        },
      };

      apiClient.get.mockResolvedValueOnce(responsePayload);

      const result = await getNotesApi();

      expect(apiClient.get).toHaveBeenCalledWith('/notes');
      expect(result).toEqual(responsePayload.data);
    });

    it('createNoteApi sends POST request to /notes with note data', async () => {
      const notePayload = { title: 'New Note', content: '<p>New Content</p>' };
      const responsePayload = {
        data: {
          note: { _id: 'note-3', ...notePayload },
        },
      };

      apiClient.post.mockResolvedValueOnce(responsePayload);

      const result = await createNoteApi(notePayload);

      expect(apiClient.post).toHaveBeenCalledWith('/notes', notePayload);
      expect(result).toEqual(responsePayload.data);
    });

    it('updateNoteApi sends PATCH request to /notes/:id with note data', async () => {
      const noteId = 'note-1';
      const updatedPayload = { title: 'Updated Title', content: '<p>Updated Content</p>' };
      const responsePayload = {
        data: {
          note: { _id: noteId, ...updatedPayload },
        },
      };

      apiClient.patch.mockResolvedValueOnce(responsePayload);

      const result = await updateNoteApi(noteId, updatedPayload);

      expect(apiClient.patch).toHaveBeenCalledWith(`/notes/${noteId}`, updatedPayload);
      expect(result).toEqual(responsePayload.data);
    });

    it('deleteNoteApi sends DELETE request to /notes/:id', async () => {
      const noteId = 'note-1';
      const responsePayload = {
        data: {
          success: true,
          message: 'Note deleted successfully',
        },
      };

      apiClient.delete.mockResolvedValueOnce(responsePayload);

      const result = await deleteNoteApi(noteId);

      expect(apiClient.delete).toHaveBeenCalledWith(`/notes/${noteId}`);
      expect(result).toEqual(responsePayload.data);
    });
  });
});
