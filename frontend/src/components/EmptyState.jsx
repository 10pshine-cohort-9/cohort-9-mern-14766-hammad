import React from 'react';

const EmptyState = ({ searchQuery, onAddNoteClick }) => {
  return (
    <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center max-w-md mx-auto my-8 space-y-3">
      <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400 font-bold text-lg">
        ?
      </div>
      <div>
        <h3 className="font-semibold text-slate-800 text-sm">
          {searchQuery ? 'No notes matched your search' : 'No notes found'}
        </h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          {searchQuery
            ? 'Try searching with different keywords or clear the filter.'
            : 'Get started by creating your first note.'}
        </p>
      </div>
      {!searchQuery && (
        <button
          onClick={onAddNoteClick}
          className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-md shadow-sm transition-colors"
        >
          Create First Note
        </button>
      )}
    </div>
  );
};

export default EmptyState;
