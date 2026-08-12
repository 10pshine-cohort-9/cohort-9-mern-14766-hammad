import React, { useState, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';

const NoteModal = ({ isOpen, onClose, onSave, editingNote, submitting }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [validationError, setValidationError] = useState('');

  // Sync state whenever editingNote or isOpen changes
  useEffect(() => {
    if (isOpen) {
      if (editingNote) {
        setTitle(editingNote.title || '');
        setContent(editingNote.content || '');
      } else {
        setTitle('');
        setContent('');
      }
      setValidationError('');
    }
  }, [editingNote, isOpen]);

  if (!isOpen) return null;

  const handleCancel = () => {
    setValidationError('');
    setTitle('');
    setContent('');
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    const cleanTitle = title.trim();
    // Strip HTML tags to check if text is truly non-empty
    const plainContent = content.replace(/<[^>]*>/g, '').trim();

    if (!cleanTitle) {
      setValidationError('Title is required');
      return;
    }

    if (cleanTitle.length > 120) {
      setValidationError('Title must not exceed 120 characters');
      return;
    }

    if (!plainContent) {
      setValidationError('Content is required');
      return;
    }

    if (content.length > 10000) {
      setValidationError('Content must not exceed 10000 characters');
      return;
    }

    onSave({ title: cleanTitle, content });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg w-full max-w-2xl p-6 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900 text-base">
            {editingNote ? 'Edit Note' : 'Create New Note'}
          </h3>
          <button
            type="button"
            onClick={handleCancel}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold px-1"
          >
            ×
          </button>
        </div>

        {validationError && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
            {validationError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Note Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Content <span className="text-red-500">*</span>
            </label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Write your note content here..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-md transition-colors"
            >
              Cancel Editing
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-md shadow-sm transition-colors disabled:opacity-60"
            >
              {submitting ? 'Saving...' : editingNote ? 'Update Note' : 'Create Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteModal;
