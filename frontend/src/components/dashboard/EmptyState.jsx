import React from 'react';
import { FileText, SearchX, Plus } from 'lucide-react';

export const EmptyState = ({ isSearch = false, onAction, searchQuery = '' }) => {
  if (isSearch) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 bg-white border border-slate-200/80 rounded-xl text-center shadow-sm space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-800">
          <SearchX className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            No notes found matching "{searchQuery}"
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            Try checking for typos or searching with a different keyword.
          </p>
        </div>
        <button
          onClick={onAction}
          className="btn-secondary text-sm"
        >
          Clear search query
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 bg-white border border-slate-200/80 rounded-xl text-center shadow-sm space-y-4">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-800">
        <FileText className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
          No notes yet
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
          Start organizing your thoughts, ideas, and tasks by creating your very first note.
        </p>
      </div>
      <button
        onClick={onAction}
        className="btn-primary text-sm py-2.5 px-5"
      >
        <Plus className="w-4 h-4" />
        <span>Create First Note</span>
      </button>
    </div>
  );
};
