import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';
import { AuthContext } from '../context/AuthContext';
import * as notesApi from '../api/notes.api';

jest.mock('../api/notes.api');

describe('Dashboard Page Component', () => {
  const mockUser = { id: 'u1', name: 'Jane Doe', email: 'jane@example.com' };
  const mockLogout = jest.fn();

  const mockNotes = [
    { _id: 'n1', title: 'React Guide', content: '<p>Learn React Testing</p>', createdAt: new Date().toISOString() },
    { _id: 'n2', title: 'Shopping List', content: '<p>Buy milk and eggs</p>', createdAt: new Date().toISOString() },
  ];

  const renderDashboard = () => {
    return render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            user: mockUser,
            token: 'fake-token',
            loading: false,
            isAuthenticated: true,
            login: jest.fn(),
            logout: mockLogout,
            register: jest.fn(),
          }}
        >
          <Dashboard />
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading skeleton initially while fetching notes', async () => {
    notesApi.getNotesApi.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

    const { container } = renderDashboard();

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders empty state when no notes exist', async () => {
    notesApi.getNotesApi.mockResolvedValueOnce({ data: { notes: [] } });

    renderDashboard();

    expect(await screen.findByText(/no notes yet/i)).toBeInTheDocument();
  });

  it('renders notes grid when notes are fetched', async () => {
    notesApi.getNotesApi.mockResolvedValueOnce({ data: { notes: mockNotes } });

    renderDashboard();

    expect(await screen.findByText('React Guide')).toBeInTheDocument();
    expect(screen.getByText('Shopping List')).toBeInTheDocument();
    expect(screen.getByText(/2 notes/i)).toBeInTheDocument();
  });

  it('filters notes based on search query', async () => {
    notesApi.getNotesApi.mockResolvedValueOnce({ data: { notes: mockNotes } });

    renderDashboard();

    await screen.findByText('React Guide');

    const searchInput = screen.getByPlaceholderText(/search notes/i);
    fireEvent.change(searchInput, { target: { value: 'React' } });

    expect(screen.getByText('React Guide')).toBeInTheDocument();
    expect(screen.queryByText('Shopping List')).not.toBeInTheDocument();
  });

  it('opens NoteModal when "Create Note" button is clicked', async () => {
    notesApi.getNotesApi.mockResolvedValueOnce({ data: { notes: mockNotes } });

    renderDashboard();

    await screen.findByText('React Guide');

    const createButtons = screen.getAllByRole('button', { name: /create note/i });
    fireEvent.click(createButtons[0]);

    expect(screen.getByText('Create New Note')).toBeInTheDocument();
  });

  it('opens DeleteConfirmModal when delete icon on note card is clicked', async () => {
    notesApi.getNotesApi.mockResolvedValueOnce({ data: { notes: mockNotes } });

    renderDashboard();

    await screen.findByText('React Guide');

    const deleteButtons = screen.getAllByTitle(/delete note/i);
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
    expect(screen.getByText(/"React Guide"/i)).toBeInTheDocument();
  });
});
