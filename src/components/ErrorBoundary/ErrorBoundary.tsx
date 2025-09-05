import React, { Component, ErrorInfo, ReactNode } from 'react';
import './ErrorBoundary.css';
import logger from '../../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
  context?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 2;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, context, level = 'component' } = this.props;
    
    // Enhanced error logging with context
    const enhancedError = {
      ...error,
      boundary: 'ErrorBoundary',
      level,
      context,
      componentStack: errorInfo.componentStack,
      retryCount: this.retryCount,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.group(`🚨 ErrorBoundary caught error (${level})`);
    logger.error('Error:', error);
    logger.error('Error Info:', errorInfo);
    logger.debug('Context:', context);
    logger.debug('Enhanced Error:', enhancedError);
    console.groupEnd();

    // Call custom error handler if provided
    if (onError) {
      try {
        onError(error, errorInfo);
      } catch (handlerError) {
        logger.error('Error in custom error handler:', handlerError);
      }
    }

    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.logToMonitoringService(enhancedError);
    }

    this.setState({
      error,
      errorInfo,
      errorId: this.state.errorId
    });
  }

  private logToMonitoringService = async (errorData: any) => {
    try {
      // Send to error monitoring service
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData)
      });
    } catch (logError) {
      logger.error('Failed to log error to monitoring service:', logError);
    }
  };

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  copyErrorDetails = async () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      context: this.props.context,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
      alert('Detalhes do erro copiados para a área de transferência');
    } catch (err) {
      logger.error('Failed to copy error details:', err);
      alert('Não foi possível copiar os detalhes do erro');
    }
  };

  render() {
    if (this.state.hasError) {
      const { fallback, level = 'component' } = this.props;
      
      if (fallback) {
        return fallback;
      }

      // Different UI based on error level
      if (level === 'component') {
        return (
          <div className="error-boundary error-boundary--component">
            <div className="error-boundary__container">
              <div className="error-boundary__icon">⚠️</div>
              <h3>Componente com erro</h3>
              <p>Este componente encontrou um problema e não pode ser exibido.</p>
              <div className="error-boundary__actions">
                {this.retryCount < this.maxRetries && (
                  <button 
                    onClick={this.handleRetry}
                    className="error-boundary__btn error-boundary__btn--primary"
                  >
                    Tentar Novamente ({this.maxRetries - this.retryCount} restantes)
                  </button>
                )}
                <button 
                  onClick={this.handleReload}
                  className="error-boundary__btn error-boundary__btn--secondary"
                >
                  Recarregar Página
                </button>
              </div>
              {process.env.NODE_ENV === 'development' && (
                <details className="error-boundary__details">
                  <summary>Detalhes do Erro (Desenvolvimento)</summary>
                  <pre>{this.state.error?.toString()}</pre>
                  <pre>{this.state.errorInfo?.componentStack}</pre>
                </details>
              )}
            </div>
          </div>
        );
      }

      // Page or critical level errors
      return (
        <div className="error-boundary error-boundary--page">
          <div className="error-boundary__container">
            <div className="error-boundary__icon">💥</div>
            <h2>Ops! Algo deu errado</h2>
            <p>
              Desculpe, mas algo inesperado aconteceu. Este erro foi registrado 
              e nossa equipe irá investigar.
            </p>
            {this.state.errorId && (
              <p className="error-boundary__error-id">
                ID do Erro: <code>{this.state.errorId}</code>
              </p>
            )}
            <div className="error-boundary__actions">
              {this.retryCount < this.maxRetries && level !== 'critical' && (
                <button 
                  onClick={this.handleRetry}
                  className="error-boundary__btn error-boundary__btn--primary"
                >
                  Tentar Novamente
                </button>
              )}
              <button 
                onClick={this.handleReload}
                className="error-boundary__btn error-boundary__btn--secondary"
              >
                Recarregar Página
              </button>
              <button 
                onClick={this.handleGoHome}
                className="error-boundary__btn error-boundary__btn--secondary"
              >
                Ir para Início
              </button>
            </div>
            <div className="error-boundary__support">
              <button 
                onClick={this.copyErrorDetails}
                className="error-boundary__btn error-boundary__btn--link"
              >
                Copiar Detalhes do Erro
              </button>
              <p className="error-boundary__support-text">
                Se o problema persistir, entre em contato com o suporte técnico 
                e forneça o ID do erro acima.
              </p>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="error-boundary__details">
                <summary>Detalhes do Erro (Desenvolvimento)</summary>
                <div className="error-boundary__debug">
                  <h4>Error:</h4>
                  <pre>{this.state.error?.toString()}</pre>
                  <h4>Component Stack:</h4>
                  <pre>{this.state.errorInfo?.componentStack}</pre>
                  <h4>Context:</h4>
                  <pre>{this.props.context || 'No context provided'}</pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;