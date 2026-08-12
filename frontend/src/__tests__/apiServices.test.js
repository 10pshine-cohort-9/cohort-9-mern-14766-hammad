import api from '../services/axios';
import authService from '../services/auth.service';
import noteService from '../services/note.service';

jest.mock('../services/axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('API Services Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authService', () => {
    test('login sends POST request to /auth/login and returns response data', async () => {
      const mockResponse = { data: { token: 'mock-token', user: { id: '1', name: 'Test' } } };
      api.post.mockResolvedValueOnce(mockResponse);

      const credentials = { email: 'test@example.com', password: 'Password123!' };
      const result = await authService.login(credentials);

      expect(api.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(result).toEqual(mockResponse.data);
    });

    test('register sends POST request to /auth/register and returns response data', async () => {
      const mockResponse = { data: { token: 'mock-token', user: { id: '2', name: 'New User' } } };
      api.post.mockResolvedValueOnce(mockResponse);

      const userData = { name: 'New User', email: 'new@example.com', password: 'Password123!' };
      const result = await authService.register(userData);

      expect(api.post).toHaveBeenCalledWith('/auth/register', userData);
      expect(result).toEqual(mockResponse.data);
    });

    test('getMe sends GET request to /auth/me and returns user data', async () => {
      const mockResponse = { data: { user: { id: '1', email: 'test@example.com' } } };
      api.get.mockResolvedValueOnce(mockResponse);

      const result = await authService.getMe();

      expect(api.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('noteService', () => {
    test('getNotes sends GET request to /notes', async () => {
      const mockNotes = [{ id: '1', title: 'Note 1', content: 'Content 1' }];
      api.get.mockResolvedValueOnce({ data: { notes: mockNotes } });

      const result = await noteService.getNotes();

      expect(api.get).toHaveBeenCalledWith('/notes');
      expect(result).toEqual({ notes: mockNotes });
    });

    test('getNote sends GET request to /notes/:id', async () => {
      const mockNote = { id: '123', title: 'Note 123', content: 'Content 123' };
      api.get.mockResolvedValueOnce({ data: { note: mockNote } });

      const result = await noteService.getNote('123');

      expect(api.get).toHaveBeenCalledWith('/notes/123');
      expect(result).toEqual({ note: mockNote });
    });

    test('createNote sends POST request to /notes with note payload', async () => {
      const noteData = { title: 'New Note', content: 'New Content' };
      const mockCreated = { id: '1', ...noteData };
      api.post.mockResolvedValueOnce({ data: { note: mockCreated } });

      const result = await noteService.createNote(noteData);

      expect(api.post).toHaveBeenCalledWith('/notes', noteData);
      expect(result).toEqual({ note: mockCreated });
    });

    test('updateNote sends PATCH request to /notes/:id with updated fields', async () => {
      const updateData = { title: 'Updated Note' };
      const mockUpdated = { id: '123', title: 'Updated Note', content: 'Old Content' };
      api.patch.mockResolvedValueOnce({ data: { note: mockUpdated } });

      const result = await noteService.updateNote('123', updateData);

      expect(api.patch).toHaveBeenCalledWith('/notes/123', updateData);
      expect(result).toEqual({ note: mockUpdated });
    });

    test('deleteNote sends DELETE request to /notes/:id', async () => {
      api.delete.mockResolvedValueOnce({ data: { message: 'Note deleted successfully' } });

      const result = await noteService.deleteNote('123');

      expect(api.delete).toHaveBeenCalledWith('/notes/123');
      expect(result).toEqual({ message: 'Note deleted successfully' });
    });
  });
});
