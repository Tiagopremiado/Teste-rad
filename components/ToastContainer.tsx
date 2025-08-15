import React from 'react';
import type { Notification } from '../types';
import Toast from './Toast';

interface ToastContainerProps {
  toasts: Notification[];
  onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-[100]"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {toasts.map((toast) => (
          <Toast key={toast.id} notification={toast} onDismiss={onDismiss} />
        ))}
      </div>
    </div>
  );
};

export default ToastContainer;
