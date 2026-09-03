import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export const Alert = ({ type = 'error', message, onClose }) => {
  if (!message) return null;

  const styles = {
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
    },
    info: {
      bg: 'bg-slate-100 border-slate-200 text-slate-800',
      icon: <Info className="w-5 h-5 text-slate-600 flex-shrink-0" />,
    },
  };

  const current = styles[type] || styles.info;

  return (
    <div
      className={`flex items-start gap-3 p-3.5 rounded-lg border text-sm font-medium transition-all ${current.bg}`}
      role="alert"
    >
      {current.icon}
      <div className="flex-1 pt-0.5">{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          aria-label="Dismiss alert"
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
