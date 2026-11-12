import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm':
        return 'max-w-sm';
      case 'md':
        return 'max-w-md';
      case 'xl':
        return 'max-w-3xl';
      case '2xl':
        return 'max-w-4xl';
      case 'lg':
      default:
        return 'max-w-xl';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Dim backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
        <div
          className={`w-full ${getMaxWidthClass()} max-h-[92vh] flex flex-col transform overflow-hidden rounded-2xl bg-white border border-slate-200 p-4 sm:p-6 text-left shadow-2xl transition-all z-10`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 shrink-0">
            <div className="pr-4">
              <h3 className="text-base sm:text-lg font-bold leading-6 text-slate-900">
                {title}
              </h3>
              {description && (
                <p className="mt-1 text-xs text-slate-500">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none shrink-0 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-3.5 overflow-y-auto flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
};
