import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DialogModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  maxWidth?: string;
  footer?: React.ReactNode;
}

export const DialogModal: React.FC<DialogModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  icon,
  maxWidth = 'max-w-lg',
  footer,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full ${maxWidth} bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all duration-200 scale-100 flex flex-col max-h-[90vh]`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-3">
            {icon && <div className="shrink-0">{icon}</div>}
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto text-slate-600 text-sm leading-relaxed">
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
