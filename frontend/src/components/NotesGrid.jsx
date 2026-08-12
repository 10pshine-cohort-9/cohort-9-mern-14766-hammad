import React from 'react';
import NoteCard from './NoteCard';

const NotesGrid = ({ notes, onEditNote, onDeleteNote }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map((note) => (
        <NoteCard
          key={note._id || note.id}
          note={note}
          onEdit={onEditNote}
          onDelete={onDeleteNote}
        />
      ))}
    </div>
  );
};

export default NotesGrid;
