import React from 'react';
import { NoteCard } from './NoteCard';

export const NotesGrid = ({ notes, onEditNote, onDeleteNote }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
