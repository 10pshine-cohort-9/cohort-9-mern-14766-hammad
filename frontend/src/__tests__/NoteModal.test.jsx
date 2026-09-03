import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NoteModal } from '../components/dashboard/NoteModal';

describe('Editor & NoteModal Form Component', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <NoteModal isOpen={false} onClose={mockOnClose} onSave={mockOnSave} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders "Create New Note" modal header and empty form fields when creating', () => {
    render(<NoteModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);

    expect(screen.getByText('Create New Note')).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveValue('');
    expect(screen.getByTestId('react-quill-editor')).toHaveValue('');
    expect(screen.getByRole('button', { name: /create note/i })).toBeInTheDocument();
  });

  it('populates initial note data and renders "Edit Note" header when editing', () => {
    const initialNote = {
      _id: '123',
      title: 'Existing Note Title',
      content: '<p>Existing HTML Content</p>',
    };

    render(
      <NoteModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialData={initialNote}
      />
    );

    expect(screen.getByText('Edit Note')).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveValue('Existing Note Title');
    expect(screen.getByTestId('react-quill-editor')).toHaveValue('<p>Existing HTML Content</p>');
    expect(screen.getByRole('button', { name: /update note/i })).toBeInTheDocument();
  });

  it('displays error message when submitting empty title', async () => {
    render(<NoteModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);

    const editor = screen.getByTestId('react-quill-editor');
    fireEvent.change(editor, { target: { value: '<p>Valid Content</p>' } });

    const submitBtn = screen.getByRole('button', { name: /create note/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('displays error message when submitting empty content', async () => {
    render(<NoteModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);

    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Valid Title' } });

    const submitBtn = screen.getByRole('button', { name: /create note/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Content is required')).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('submits form successfully with title and content', async () => {
    mockOnSave.mockResolvedValueOnce({});

    render(<NoteModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);

    const titleInput = screen.getByLabelText(/title/i);
    const editor = screen.getByTestId('react-quill-editor');

    fireEvent.change(titleInput, { target: { value: 'My New Note' } });
    fireEvent.change(editor, { target: { value: '<p>Some awesome content</p>' } });

    const submitBtn = screen.getByRole('button', { name: /create note/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        title: 'My New Note',
        content: '<p>Some awesome content</p>',
      });
    });
  });

  it('calls onClose when Cancel button is clicked', () => {
    render(<NoteModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
