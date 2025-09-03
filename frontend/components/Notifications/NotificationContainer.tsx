// src/components/Notifications/NotificationContainer.tsx
import React from 'react';
import { useError } from '../../contexts/ErrorContext';
import NotificationItem from './NotificationItem';
import './NotificationContainer.css';

const NotificationContainer: React.FC = () => {
  const { notifications } = useError();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-container" role="region" aria-label="Notificações">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;