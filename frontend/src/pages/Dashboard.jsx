import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navbar } from '../components/dashboard/Navbar';
import { NotesGrid } from '../components/dashboard/NotesGrid';
import { LoadingState } from '../components/dashboard/LoadingState';
import { EmptyState } from '../components/dashboard/EmptyState';
import { NoteModal } from '../components/dashboard/NoteModal';
import { DeleteConfirmModal } from '../components/dashboard/DeleteConfirmModal';
import { Alert } from '../components/ui/Alert';
import { getNotesApi, createNoteApi, updateNoteApi, deleteNoteApi } from '../api/notes.api';
import { Plus, RefreshCw, FileText } from 'lucide-react';

export const Dashboard = () => {
  const { user, logout } = useAuth();

  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [deletingNote, setDeletingNote] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Success / Status banner
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchNotes = async () => {
    setIsLoading(true);
    setFetchError('');
    try {
      const response = await getNotesApi();
      if (response?.data?.notes) {
        setNotes(response.data.notes);
      } else {
        setNotes([]);
      }
    } catch (err) {
      setFetchError(err.message || 'Failed to load notes. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Filter notes client-side based on search query
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const query = searchQuery.toLowerCase().trim();
    return notes.filter(
      (note) =>
        (note.title && note.title.toLowerCase().includes(query)) ||
        (note.content && note.content.toLowerCase().includes(query))
    );
  }, [notes, searchQuery]);

  // Handle Note Save (Create or Edit)
  const handleSaveNote = async (noteData) => {
    setIsSaving(true);
    try {
      if (editingNote) {
        const id = editingNote._id || editingNote.id;
        const res = await updateNoteApi(id, noteData);
        const updated = res?.data?.note;
        if (updated) {
          setNotes((prev) =>
            prev.map((n) => ((n._id || n.id) === id ? updated : n))
          );
        } else {
          await fetchNotes();
        }
        showToast('Note updated successfully!');
      } else {
        const res = await createNoteApi(noteData);
        const newNote = res?.data?.note;
        if (newNote) {
          setNotes((prev) => [newNote, ...prev]);
        } else {
          await fetchNotes();
        }
        showToast('Note created successfully!');
      }
      setIsModalOpen(false);
      setEditingNote(null);
    } catch (err) {
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Note Delete
  const handleConfirmDelete = async () => {
    if (!deletingNote) return;
    setIsDeleting(true);
    const id = deletingNote._id || deletingNote.id;
    try {
      await deleteNoteApi(id);
      setNotes((prev) => prev.filter((n) => (n._id || n.id) !== id));
      showToast('Note deleted successfully', 'info');
      setDeletingNote(null);
    } catch (err) {
      setToastMessage({
        message: err.message || 'Failed to delete note',
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (note) => {
    setDeletingNote(note);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Navbar */}
      <Navbar
        user={user}
        onLogout={logout}
        onOpenCreateModal={handleOpenCreate}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchClear={() => setSearchQuery('')}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Banner / Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                My Notes
              </h1>
              <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {notes.length} {notes.length === 1 ? 'note' : 'notes'}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Organize your thoughts, ideas, and tasks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchNotes}
              disabled={isLoading}
              className="btn-secondary text-sm p-2.5"
              title="Refresh notes"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleOpenCreate}
              className="btn-primary text-sm py-2.5 px-4"
            >
              <Plus className="w-4 h-4" />
              <span>Create Note</span>
            </button>
          </div>
        </div>

        {/* Global Toast Alert */}
        {toastMessage && (
          <Alert
            type={toastMessage.type}
            message={toastMessage.message}
            onClose={() => setToastMessage(null)}
          />
        )}

        {/* Fetch Error Alert */}
        {fetchError && (
          <Alert
            type="error"
            message={fetchError}
            onClose={() => setFetchError('')}
          />
        )}

        {/* Dynamic Grid / States */}
        {isLoading ? (
          <LoadingState count={6} />
        ) : notes.length === 0 ? (
          <EmptyState isSearch={false} onAction={handleOpenCreate} />
        ) : filteredNotes.length === 0 ? (
          <EmptyState
            isSearch={true}
            searchQuery={searchQuery}
            onAction={() => setSearchQuery('')}
          />
        ) : (
          <NotesGrid
            notes={filteredNotes}
            onEditNote={handleOpenEdit}
            onDeleteNote={handleOpenDelete}
          />
        )}
      </main>

      {/* Note Create & Edit Modal */}
      <NoteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNote(null);
        }}
        onSave={handleSaveNote}
        initialData={editingNote}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingNote)}
        onClose={() => setDeletingNote(null)}
        onConfirm={handleConfirmDelete}
        noteTitle={deletingNote?.title || ''}
        isDeleting={isDeleting}
      />
    </div>
  );
};
