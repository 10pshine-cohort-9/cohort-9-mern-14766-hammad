import React from 'react';

const LoadingState = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="space-y-2">
            <div className="h-3 bg-slate-100 rounded w-full" />
            <div className="h-3 bg-slate-100 rounded w-5/6" />
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
            <div className="h-4 bg-slate-100 rounded w-8" />
            <div className="h-4 bg-slate-100 rounded w-10" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingState;
