import React from 'react';

interface ConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmClass?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    title, message, onConfirm, onCancel, 
    confirmText = 'Удалить', cancelText = 'Отмена', 
    confirmClass = 'bg-brand-red text-white' 
}) => {
  return (
    <div 
      className="fixed inset-0 bg-primary/80 backdrop-blur-xl flex justify-center items-center z-50 p-4"
      onClick={onCancel}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-secondary p-4 md:p-6 rounded-3xl shadow-soft-glow max-w-sm w-full border border-border-color"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-text-primary mb-4">{title}</h2>
        <p className="text-text-secondary mb-8">
          {message}
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl bg-accent border border-border-color text-text-primary hover:bg-white/10 transition-colors font-semibold"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-opacity ${confirmClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;