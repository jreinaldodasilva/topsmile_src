// src/components/Notifications/NotificationItem.tsx
import React, { useEffect, useState } from 'react';
import { useError, ErrorNotification } from '../../contexts/ErrorContext';
import './NotificationItem.css';

interface NotificationItemProps {
  notification: ErrorNotification;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const { dismissNotification } = useError();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Animation entrance effect
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      dismissNotification(notification.id);
    }, 300); // Match CSS animation duration
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      default:
        return 'ℹ️';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className={`notification-item notification-item--${notification.type} ${
        isVisible ? 'notification-item--visible' : ''
      } ${isExiting ? 'notification-item--exiting' : ''}`}
      role="alert"
      aria-live="polite"
    >
      <div className="notification-item__icon">
        {getIcon()}
      </div>
      
      <div className="notification-item__content">
        <div className="notification-item__header">
          <h4 className="notification-item__title">{notification.title}</h4>
          <span className="notification-item__time">
            {formatTime(notification.timestamp)}
          </span>
        </div>
        
        <p className="notification-item__message">{notification.message}</p>
        
        {notification.action && (
          <button
            className="notification-item__action"
            onClick={notification.action.onClick}
            type="button"
          >
            {notification.action.label}
          </button>
        )}
      </div>
      
      <button
        className="notification-item__close"
        onClick={handleDismiss}
        aria-label="Fechar notificação"
        type="button"
      >
        ×
      </button>
    </div>
  );
};

export default NotificationItem;