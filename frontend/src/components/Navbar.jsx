import React from 'react';
import SearchBar from './SearchBar';

const Navbar = ({ user, logout, searchQuery, setSearchQuery, onAddNoteClick }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-bold text-lg text-slate-900 tracking-tight">Notes App</span>
        </div>

        {/* Search Bar Component */}
        <div className="flex-1 max-w-md hidden sm:block">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onAddNoteClick}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-md shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>+ New Note</span>
          </button>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-600 hidden md:inline font-medium">
              {user?.name || user?.email}
            </span>
            <button
              onClick={logout}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md border border-slate-300 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="px-4 pb-3 sm:hidden">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>
    </header>
  );
};

export default Navbar;
