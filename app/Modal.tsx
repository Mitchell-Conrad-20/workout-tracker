'use client';
import React, { useEffect } from 'react';

type ModalProps = {
  open?: boolean;
  dark?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
};

const Modal: React.FC<ModalProps> = ({ children, open = false, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    if (open) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  return open ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col gap-4 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 p-6 rounded-2xl shadow-2xl max-w-md w-full transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 text-xl"
          aria-label="Close modal"
        >
          &times;
        </button>

        {children}
      </div>
    </div>
  ) : null;
};

export default Modal;
