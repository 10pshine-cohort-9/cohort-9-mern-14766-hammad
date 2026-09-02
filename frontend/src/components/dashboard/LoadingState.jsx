import React from 'react';

export const LoadingState = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm animate-pulse flex flex-col justify-between h-52"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 bg-slate-200 rounded w-3/4"></div>
            </div>
            <div className="space-y-2 mt-4">
              <div className="h-3.5 bg-slate-200 rounded w-full"></div>
              <div className="h-3.5 bg-slate-200 rounded w-5/6"></div>
              <div className="h-3.5 bg-slate-200 rounded w-4/6"></div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="h-3 bg-slate-200 rounded w-20"></div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-slate-200 rounded-lg"></div>
              <div className="w-7 h-7 bg-slate-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
