import React from 'react';
import { Edit3, Trash2, Calendar } from 'lucide-react';

export const NoteCard = ({ note, onEdit, onDelete }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const isHtml = (str) => /<[a-z][\s\S]*>/i.test(str);

  return (
    <div
      onClick={() => onEdit(note)}
      className="group bg-white border border-slate-200/80 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-150 p-5 flex flex-col justify-between h-56 cursor-pointer"
    >
      <div className="overflow-hidden">
        <h3 className="font-bold text-slate-900 text-base tracking-tight line-clamp-1 mb-2 group-hover:text-slate-700 transition-colors">
          {note.title}
        </h3>

        {isHtml(note.content) ? (
          <div
            className="rich-text-preview text-slate-600 text-sm leading-relaxed line-clamp-4 overflow-hidden"
            dangerouslySetInnerHTML={{ __html: note.content }}
          />
        ) : (
          <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap line-clamp-4">
            {note.content}
          </p>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{formatDate(note.updatedAt || note.createdAt)}</span>
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEdit(note)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Edit Note"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(note)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete Note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
