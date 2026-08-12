import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NoteModal from '../components/NoteModal';
import RichTextEditor from '../components/RichTextEditor';

describe('RichTextEditor & NoteModal Component Tests', () => {
  describe('RichTextEditor Component', () => {
    test('renders rich text editor with placeholder and handles text change', () => {
      const handleChange = jest.fn();
      render(
        <RichTextEditor
          value=""
          onChange={handleChange}
          placeholder="Write your note content here..."
        />
      );

      const editor = screen.getByTestId('rich-text-editor');
      expect(editor).toBeInTheDocument();
      expect(editor).toHaveAttribute('placeholder', 'Write your note content here...');

      fireEvent.change(editor, { target: { value: 'Sample Note Content' } });
      expect(handleChange).toHaveBeenCalledWith('Sample Note Content');
    });
  });

  describe('NoteModal Component', () => {
    const mockOnClose = jest.fn();
    const mockOnSave = jest.fn();

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('does not render when isOpen is false', () => {
      const { container } = render(
        <NoteModal
          isOpen={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
          editingNote={null}
          submitting={false}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    test('renders Create New Note modal when opening for new note', () => {
      render(
        <NoteModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          editingNote={null}
          submitting={false}
        />
      );

      expect(screen.getByRole('heading', { name: /create new note/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/note title/i)).toHaveValue('');
      expect(screen.getByRole('button', { name: /create note/i })).toBeInTheDocument();
    });

    test('pre-fills fields when opening modal in edit mode', async () => {
      const existingNote = {
        id: '123',
        title: 'Existing Note Title',
        content: '<p>Existing Content</p>',
      };

      render(
        <NoteModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          editingNote={existingNote}
          submitting={false}
        />
      );

      expect(screen.getByRole('heading', { name: /edit note/i })).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/note title/i)).toHaveValue('Existing Note Title');
        expect(screen.getByTestId('rich-text-editor')).toHaveValue('<p>Existing Content</p>');
      });

      expect(screen.getByRole('button', { name: /update note/i })).toBeInTheDocument();
    });

    test('shows validation error when title is empty on submit', async () => {
      render(
        <NoteModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          editingNote={null}
          submitting={false}
        />
      );

      const editor = screen.getByTestId('rich-text-editor');
      fireEvent.change(editor, { target: { value: 'Some content' } });

      const submitBtn = screen.getByRole('button', { name: /create note/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    test('shows validation error when content is empty on submit', async () => {
      render(
        <NoteModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          editingNote={null}
          submitting={false}
        />
      );

      const titleInput = screen.getByPlaceholderText(/note title/i);
      fireEvent.change(titleInput, { target: { value: 'Valid Title' } });

      const submitBtn = screen.getByRole('button', { name: /create note/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Content is required')).toBeInTheDocument();
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    test('shows validation error when title exceeds 120 characters', async () => {
      render(
        <NoteModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          editingNote={null}
          submitting={false}
        />
      );

      const titleInput = screen.getByPlaceholderText(/note title/i);
      const longTitle = 'A'.repeat(125);
      fireEvent.change(titleInput, { target: { value: longTitle } });

      const editor = screen.getByTestId('rich-text-editor');
      fireEvent.change(editor, { target: { value: 'Valid content body' } });

      const submitBtn = screen.getByRole('button', { name: /create note/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Title must not exceed 120 characters')).toBeInTheDocument();
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    test('calls onSave with title and content when form is valid', async () => {
      render(
        <NoteModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          editingNote={null}
          submitting={false}
        />
      );

      const titleInput = screen.getByPlaceholderText(/note title/i);
      const editor = screen.getByTestId('rich-text-editor');

      fireEvent.change(titleInput, { target: { value: 'My New Note' } });
      fireEvent.change(editor, { target: { value: '<p>Important details here</p>' } });

      const submitBtn = screen.getByRole('button', { name: /create note/i });
      fireEvent.click(submitBtn);

      expect(mockOnSave).toHaveBeenCalledWith({
        title: 'My New Note',
        content: '<p>Important details here</p>',
      });
    });

    test('calls onClose when cancel button is clicked', async () => {
      render(
        <NoteModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          editingNote={null}
          submitting={false}
        />
      );

      const cancelBtn = screen.getByRole('button', { name: /cancel editing/i });
      fireEvent.click(cancelBtn);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('disables submit button and shows Saving... when submitting is true', () => {
      render(
        <NoteModal
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          editingNote={null}
          submitting={true}
        />
      );

      const submitBtn = screen.getByRole('button', { name: /saving\.\.\./i });
      expect(submitBtn).toBeDisabled();
    });
  });
});
