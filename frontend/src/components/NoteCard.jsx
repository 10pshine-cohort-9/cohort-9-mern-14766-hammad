import React from 'react';

const NoteCard = ({ note, onEdit, onDelete }) => {
  const noteId = note.id || note._id;
  const formattedDate = note.createdAt
    ? new Date(note.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors h-full">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-1">
            {note.title}
          </h3>
          {formattedDate && (
            <span className="text-[11px] text-slate-400 shrink-0 font-normal">
              {formattedDate}
            </span>
          )}
        </div>

        {/* Rich Text Preview */}
        <div
          className="rich-text-preview text-xs text-slate-600 leading-relaxed max-h-36 overflow-hidden relative"
          dangerouslySetInnerHTML={{ __html: note.content }}
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-100 text-xs">
        <button
          onClick={() => onEdit(note)}
          className="px-2.5 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors font-medium"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(noteId)}
          className="px-2.5 py-1 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors font-medium"
        >
          Delete
        </button>
      </div>

      <style>{`
        .rich-text-preview h1 { font-size: 1rem; font-weight: 700; margin-bottom: 0.25rem; }
        .rich-text-preview h2 { font-size: 0.875rem; font-weight: 700; margin-bottom: 0.25rem; }
        .rich-text-preview h3 { font-size: 0.75rem; font-weight: 700; margin-bottom: 0.25rem; }
        .rich-text-preview p { margin-bottom: 0.25rem; }
        .rich-text-preview ul { list-style-type: disc; padding-left: 1.25rem; margin-bottom: 0.25rem; }
        .rich-text-preview ol { list-style-type: decimal; padding-left: 1.25rem; margin-bottom: 0.25rem; }
        .rich-text-preview blockquote { border-left: 3px solid #cbd5e1; padding-left: 0.5rem; color: #64748b; font-style: italic; }
        .rich-text-preview code { background-color: #f1f5f9; padding: 0.125rem 0.25rem; rounded: 0.25rem; font-family: monospace; }
        .rich-text-preview pre { background-color: #0f172a; color: #f8fafc; padding: 0.5rem; rounded: 0.375rem; overflow-x: auto; font-family: monospace; }
      `}</style>
    </div>
  );
};

export default NoteCard;
