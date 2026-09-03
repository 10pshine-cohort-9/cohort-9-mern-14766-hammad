import React, { forwardRef } from 'react';

export const Input = forwardRef(
  ({ label, id, error, icon: Icon, rightElement, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {Icon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={`w-full bg-white border ${
              error ? 'border-rose-500 focus:border-rose-600 focus:ring-rose-500/10' : 'border-slate-200 focus:border-slate-800 focus:ring-slate-900/10'
            } rounded-lg py-2.5 ${Icon ? 'pl-10' : 'pl-3.5'} ${
              rightElement ? 'pr-10' : 'pr-3.5'
            } text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all duration-150 ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 flex items-center justify-center">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs font-medium text-rose-600 flex items-center gap-1 mt-0.5">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
