import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Alert } from '../ui/Alert';
import { RichTextEditor } from './RichTextEditor';

export const NoteModal = ({ isOpen, onClose, onSave, initialData = null, isSaving = false }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '');
      setContent(initialData?.content || '');
      setError('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Utility to check if HTML content actually contains text
  const isContentEmpty = (html) => {
    if (!html) return true;
    const stripped = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    return stripped.length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (isContentEmpty(content)) {
      setError('Content is required');
      return;
    }

    try {
      setError('');
      await onSave({ title: title.trim(), content });
    } catch (err) {
      setError(err.message || 'Failed to save note. Please try again.');
    }
  };

  const handleCancel = () => {
    setError('');
    onClose();
  };

  const isEdit = Boolean(initialData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {isEdit ? 'Edit Note' : 'Create New Note'}
          </h2>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col flex-1 overflow-y-auto space-y-4">
          {error && <Alert type="error" message={error} onClose={() => setError('')} />}

          <div className="space-y-1.5">
            <label htmlFor="note-title" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="note-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Meeting Notes, Project Specification..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all duration-150 font-medium"
              autoFocus
            />
          </div>

          <div className="space-y-1.5 flex-1 flex flex-col">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Content <span className="text-rose-500">*</span>
            </label>
            <RichTextEditor
              key={initialData?._id || initialData?.id || 'new-note'}
              value={content}
              onChange={setContent}
              placeholder="Write your note content here..."
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="btn-secondary text-sm py-2 px-4"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary text-sm py-2 px-4"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEdit ? 'Update Note' : 'Create Note'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
