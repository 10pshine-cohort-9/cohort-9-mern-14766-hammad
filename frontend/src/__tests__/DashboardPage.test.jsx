import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
import noteService from '../services/note.service';

const mockLogout = jest.fn();
const mockUser = { id: 'user-1', name: 'John Doe', email: 'john@example.com' };

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
    isAuthenticated: true,
    loading: false,
  }),
}));

jest.mock('../services/note.service', () => ({
  getNotes: jest.fn(),
  createNote: jest.fn(),
  updateNote: jest.fn(),
  deleteNote: jest.fn(),
}));

const renderDashboardPage = () => {
  return render(
    <BrowserRouter>
      <DashboardPage />
    </BrowserRouter>
  );
};

describe('DashboardPage Component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('fetches notes on mount and displays skeleton loading state initially', async () => {
    noteService.getNotes.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { notes: [] } }), 100))
    );

    const { container } = renderDashboardPage();

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(noteService.getNotes).toHaveBeenCalledTimes(1);
    });
  });

  test('renders EmptyState when no notes are returned from API', async () => {
    noteService.getNotes.mockResolvedValueOnce({ data: { notes: [] } });

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByText(/no notes found/i)).toBeInTheDocument();
    });
  });

  test('renders NotesGrid with fetched notes', async () => {
    const mockNotesList = [
      { id: '1', title: 'React Hooks Guide', content: 'Learn useState and useEffect' },
      { id: '2', title: 'Express API Design', content: 'RESTful API best practices' },
    ];
    noteService.getNotes.mockResolvedValueOnce({ data: { notes: mockNotesList } });

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByText('React Hooks Guide')).toBeInTheDocument();
      expect(screen.getByText('Express API Design')).toBeInTheDocument();
    });
  });

  test('filters notes dynamically when typing in search bar', async () => {
    const mockNotesList = [
      { id: '1', title: 'React Hooks Guide', content: 'Learn useState' },
      { id: '2', title: 'Express API Design', content: 'RESTful endpoints' },
    ];
    noteService.getNotes.mockResolvedValueOnce({ data: { notes: mockNotesList } });

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByText('React Hooks Guide')).toBeInTheDocument();
    });

    const searchInputs = screen.getAllByPlaceholderText(/search notes/i);
    await userEvent.type(searchInputs[0], 'Express');

    expect(screen.queryByText('React Hooks Guide')).not.toBeInTheDocument();
    expect(screen.getByText('Express API Design')).toBeInTheDocument();
  });

  test('deletes a note when delete button is clicked on note card', async () => {
    const mockNotesList = [{ id: '100', title: 'Temporary Note', content: 'To be deleted' }];
    noteService.getNotes.mockResolvedValueOnce({ data: { notes: mockNotesList } });
    noteService.deleteNote.mockResolvedValueOnce({ message: 'Deleted' });

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByText('Temporary Note')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole('button', { name: /^delete$/i });
    await userEvent.click(deleteBtn);

    await waitFor(() => {
      expect(noteService.deleteNote).toHaveBeenCalledWith('100');
      expect(screen.queryByText('Temporary Note')).not.toBeInTheDocument();
    });
  });

  test('opens create note modal when clicking Add Note button', async () => {
    noteService.getNotes.mockResolvedValueOnce({ data: { notes: [] } });

    renderDashboardPage();

    await waitFor(() => {
      expect(screen.getByText(/no notes found/i)).toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: /\+ new note/i });
    await userEvent.click(addBtn);

    expect(screen.getByRole('heading', { name: /create new note/i })).toBeInTheDocument();
  });
});
