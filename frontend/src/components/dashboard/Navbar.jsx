import React from 'react';
import { LogOut, Plus } from 'lucide-react';
import { SearchBar } from './SearchBar';

export const Navbar = ({
  user,
  onLogout,
  onOpenCreateModal,
  searchQuery,
  onSearchChange,
  onSearchClear,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand logo & title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            N
          </div>
          <span className="font-bold text-slate-900 tracking-tight text-lg hidden sm:inline-block">
            Notes App
          </span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-2">
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            onClear={onSearchClear}
            placeholder="Search notes..."
          />
        </div>

        {/* User actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenCreateModal}
            className="btn-primary text-sm py-2 px-3.5"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Note</span>
          </button>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="max-w-[150px] truncate">{user?.email}</span>
          </div>

          <button
            onClick={onLogout}
            className="btn-secondary text-sm py-2 px-3 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
