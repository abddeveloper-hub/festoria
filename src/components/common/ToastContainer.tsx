import React from 'react';
import { useFest } from '../../context/FestContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useFest();

  if (toasts.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-emerald-200';
      case 'error':
        return 'border-rose-200';
      case 'warning':
        return 'border-amber-200';
      default:
        return 'border-slate-200';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto bg-white border ${getBorderColor(
            toast.type
          )} shadow-md rounded-lg p-3 flex items-start gap-2.5 transition-all animate-in fade-in slide-in-from-bottom-2`}
        >
          <div className="mt-0.5">{getIcon(toast.type)}</div>
          <div className="flex-1 min-w-0">
            <h5 className="text-xs font-semibold text-slate-900">{toast.title}</h5>
            <p className="text-xs text-slate-500 mt-0.5 break-words">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
