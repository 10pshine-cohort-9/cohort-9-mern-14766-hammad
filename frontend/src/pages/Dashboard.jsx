import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogOut } from 'lucide-react';

export const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-lg">
              N
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-lg">
              Notes App
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{user?.email}</span>
            </div>

            <button
              onClick={logout}
              className="btn-secondary text-sm py-2 px-3 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>
    </div>
  );
};

