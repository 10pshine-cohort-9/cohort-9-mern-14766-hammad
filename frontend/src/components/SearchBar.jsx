import React from 'react';

const SearchBar = ({ value, onChange, placeholder = 'Search notes by title or content...' }) => {
  return (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
          title="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default SearchBar;
