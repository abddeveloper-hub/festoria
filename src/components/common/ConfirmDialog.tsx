import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = true,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="flex gap-3">
        {isDestructive && (
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        )}
        <div className="text-sm text-slate-600">
          <p>{message}</p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-3.5 py-1.5 text-xs font-medium rounded transition-colors ${
            isDestructive
              ? 'text-white bg-rose-600 hover:bg-rose-700 border border-transparent'
              : 'text-white bg-slate-900 hover:bg-slate-800 border border-transparent'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};
