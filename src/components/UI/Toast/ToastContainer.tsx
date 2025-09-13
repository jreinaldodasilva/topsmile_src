import React from 'react';
import Toast, { ToastProps } from './Toast';
import './ToastContainer.css';

export interface ToastContainerProps {
  toasts: ToastProps[];
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  position = 'top-right'
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className={`toast-container toast-container--${position}`} role="region" aria-label="Notificações">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
};

export default ToastContainer;
