// src/contexts/ErrorContext.tsx - Centralized Error Management
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import logger from '../utils/logger';

export interface ErrorNotification {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  duration?: number; // Auto-dismiss after this many ms (0 = no auto-dismiss)
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ErrorContextType {
  notifications: ErrorNotification[];
  showError: (title: string, message: string, options?: Partial<ErrorNotification>) => string;
  showWarning: (title: string, message: string, options?: Partial<ErrorNotification>) => string;
  showInfo: (title: string, message: string, options?: Partial<ErrorNotification>) => string;
  showSuccess: (title: string, message: string, options?: Partial<ErrorNotification>) => string;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  logError: (error: Error, context?: string, metadata?: Record<string, any>) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<ErrorNotification[]>([]);

  const generateId = useCallback(() => {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const addNotification = useCallback((
    type: ErrorNotification['type'],
    title: string,
    message: string,
    options: Partial<ErrorNotification> = {}
  ): string => {
    const id = generateId();
    const notification: ErrorNotification = {
      id,
      type,
      title,
      message,
      timestamp: new Date(),
      duration: type === 'success' ? 5000 : type === 'info' ? 7000 : 0, // Auto-dismiss success/info
      ...options
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-dismiss if duration is set
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        dismissNotification(id);
      }, notification.duration);
    }

    return id;
  }, [generateId, dismissNotification]);

  const showError = useCallback((title: string, message: string, options?: Partial<ErrorNotification>) => {
    return addNotification('error', title, message, options);
  }, [addNotification]);

  const showWarning = useCallback((title: string, message: string, options?: Partial<ErrorNotification>) => {
    return addNotification('warning', title, message, options);
  }, [addNotification]);

  const showInfo = useCallback((title: string, message: string, options?: Partial<ErrorNotification>) => {
    return addNotification('info', title, message, options);
  }, [addNotification]);

  const showSuccess = useCallback((title: string, message: string, options?: Partial<ErrorNotification>) => {
    return addNotification('success', title, message, options);
  }, [addNotification]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const logError = useCallback((error: Error, context?: string, metadata?: Record<string, any>) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
      metadata,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error logged: ${error.name}`);
      logger.error('Error:', error);
      logger.debug('Context:', context);
      logger.debug('Metadata:', metadata);
      logger.debug('Full Error Data:', errorData);
      console.groupEnd();
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with error monitoring service (Sentry, LogRocket, etc.)
      try {
        // Example: Send to your error logging endpoint
        fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorData)
        }).catch(logErr => {
          logger.error('Failed to log error to server:', logErr);
        });
      } catch (logError) {
        logger.error('Error logging failed:', logError);
      }
    }

    // Show user-friendly error notification
    const userMessage = getUserFriendlyErrorMessage(error, context);
    showError('Erro no Sistema', userMessage, {
      action: {
        label: 'Reportar Problema',
        onClick: () => {
          // Open support form or copy error details
          navigator.clipboard?.writeText(JSON.stringify(errorData, null, 2))
            .then(() => showInfo('Copiado', 'Detalhes do erro copiados para a área de transferência'))
            .catch(() => showWarning('Aviso', 'Não foi possível copiar os detalhes do erro'));
        }
      }
    });
  }, [showError, showInfo, showWarning]);

  const value: ErrorContextType = {
    notifications,
    showError,
    showWarning,
    showInfo,
    showSuccess,
    dismissNotification,
    clearAllNotifications,
    logError
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

// Helper function to convert technical errors to user-friendly messages
function getUserFriendlyErrorMessage(error: Error, context?: string): string {
  const errorMessage = error.message.toLowerCase();
  
  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return 'Problema de conexão. Verifique sua internet e tente novamente.';
  }
  
  // Authentication errors
  if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
    return 'Sua sessão expirou. Faça login novamente.';
  }
  
  // Permission errors
  if (errorMessage.includes('forbidden') || errorMessage.includes('403')) {
    return 'Você não tem permissão para realizar esta ação.';
  }
  
  // Not found errors
  if (errorMessage.includes('not found') || errorMessage.includes('404')) {
    return 'O recurso solicitado não foi encontrado.';
  }
  
  // Server errors
  if (errorMessage.includes('500') || errorMessage.includes('server')) {
    return 'Erro interno do servidor. Nossa equipe foi notificada.';
  }
  
  // Validation errors
  if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
    return 'Dados inválidos. Verifique as informações e tente novamente.';
  }
  
  // Context-specific errors
  if (context) {
    switch (context) {
      case 'login':
        return 'Erro no login. Verifique suas credenciais.';
      case 'contact-form':
        return 'Erro ao enviar formulário. Tente novamente.';
      case 'data-loading':
        return 'Erro ao carregar dados. Atualize a página.';
      case 'data-saving':
        return 'Erro ao salvar dados. Tente novamente.';
      default:
        break;
    }
  }
  
  // Generic fallback
  return 'Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.';
}

export default ErrorProvider;