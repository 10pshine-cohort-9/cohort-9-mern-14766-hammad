import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import noteService from '../services/note.service';
import Navbar from '../components/Navbar';
import NotesGrid from '../components/NotesGrid';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import NoteModal from '../components/NoteModal';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await noteService.getNotes();
      // Handle response format: res.data.notes or res.data or res.notes
      const fetchedNotes = res.data?.notes || res.data || res.notes || [];
      setNotes(Array.isArray(fetchedNotes) ? fetchedNotes : []);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError(err.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
  };

  const handleSaveNote = async ({ title, content }) => {
    try {
      setSubmitting(true);
      setError('');

      if (editingNote) {
        const id = editingNote._id || editingNote.id;
        const res = await noteService.updateNote(id, { title, content });
        const updated = res.data?.note || res.data || res.note;
        setNotes((prev) =>
          prev.map((n) => (String(n.id || n._id) === String(id) ? updated || { ...n, title, content } : n))
        );
      } else {
        const res = await noteService.createNote({ title, content });
        const created = res.data?.note || res.data || res.note;
        if (created) {
          setNotes((prev) => [created, ...prev]);
        } else {
          await fetchNotes();
        }
      }

      handleCloseModal();
    } catch (err) {
      console.error('Error saving note:', err);
      setError(err.message || 'Failed to save note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (id) => {
    if (!id) return;

    try {
      setError('');
      // Immediate UI update
      setNotes((prev) => prev.filter((n) => String(n.id || n._id) !== String(id)));
      await noteService.deleteNote(id);
    } catch (err) {
      console.error('Error deleting note:', err);
      setError(err.message || 'Failed to delete note');
      fetchNotes();
    }
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Reusable Navbar */}
      <Navbar
        user={user}
        logout={logout}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onAddNoteClick={handleOpenAddModal}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-xs">
            {error}
          </div>
        )}

        {/* Section Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900">
            Notes <span className="text-xs font-normal text-slate-500">({filteredNotes.length})</span>
          </h1>
        </div>

        {/* Conditional Rendering: Loading, Empty, or Grid */}
        {loading ? (
          <LoadingState />
        ) : filteredNotes.length === 0 ? (
          <EmptyState searchQuery={searchQuery} onAddNoteClick={handleOpenAddModal} />
        ) : (
          <NotesGrid
            notes={filteredNotes}
            onEditNote={handleOpenEditModal}
            onDeleteNote={handleDeleteNote}
          />
        )}
      </main>

      {/* Reusable Note Create/Edit Modal */}
      <NoteModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveNote}
        editingNote={editingNote}
        submitting={submitting}
      />
    </div>
  );
};

export default DashboardPage;
