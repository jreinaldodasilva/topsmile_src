import React, { useState, useEffect } from 'react';
import { paymentService, RetryState } from '../../services/paymentService';
import './PaymentRetryModal.css';

interface PaymentRetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => Promise<void>;
  retryId: string;
  errorMessage: string;
  isRetrying: boolean;
}

const PaymentRetryModal: React.FC<PaymentRetryModalProps> = ({
  isOpen,
  onClose,
  onRetry,
  retryId,
  errorMessage,
  isRetrying
}) => {
  const [retryState, setRetryState] = useState<RetryState | null>(null);
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    if (isOpen && retryId) {
      const state = paymentService.getRetryState(retryId);
      setRetryState(state);

      // Update countdown every second
      const interval = setInterval(() => {
        const currentState = paymentService.getRetryState(retryId);
        setRetryState(currentState);

        if (currentState?.remainingTime) {
          setCountdown(paymentService.formatRemainingTime(currentState.remainingTime));
        } else {
          setCountdown('');
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOpen, retryId]);

  if (!isOpen) return null;

  const handleRetry = async () => {
    try {
      await onRetry();
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  const canRetry = retryState?.canRetry && retryState.retryCount < retryState.maxRetries;
  const isExpired = retryState && !retryState.canRetry;

  return (
    <div className="payment-retry-modal-overlay">
      <div className="payment-retry-modal">
        <div className="modal-header">
          <h2 className="modal-title">Payment Failed</h2>
          <button
            className="modal-close-button"
            onClick={onClose}
            disabled={isRetrying}
          >
            <svg className="close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="error-icon">
            <svg className="error-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          <p className="error-message">{errorMessage}</p>

          {retryState && (
            <div className="retry-info">
              <div className="retry-attempts">
                <span className="attempts-label">Attempts:</span>
                <span className="attempts-value">
                  {retryState.retryCount} / {retryState.maxRetries}
                </span>
              </div>

              {canRetry && countdown && (
                <div className="retry-timer">
                  <span className="timer-label">Time remaining:</span>
                  <span className="timer-value">{countdown}</span>
                </div>
              )}

              {isExpired && (
                <div className="retry-expired">
                  <span className="expired-message">Retry window has expired</span>
                </div>
              )}
            </div>
          )}

          <div className="retry-suggestions">
            <h3>What you can do:</h3>
            <ul>
              <li>Check your internet connection</li>
              <li>Try using a different payment method</li>
              <li>Contact your bank if the issue persists</li>
              <li>Wait a few minutes before trying again</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="cancel-button"
            onClick={onClose}
            disabled={isRetrying}
          >
            Cancel
          </button>

          {canRetry && (
            <button
              className="retry-button"
              onClick={handleRetry}
              disabled={isRetrying || !canRetry}
            >
              {isRetrying ? (
                <>
                  <svg className="loading-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Retrying...
                </>
              ) : (
                <>
                  <svg className="retry-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
                </>
              )}
            </button>
          )}

          {!canRetry && !isExpired && (
            <button
              className="contact-support-button"
              onClick={() => {
                // You can implement support contact logic here
                window.open('mailto:support@topsmile.com?subject=Payment Issue', '_blank');
              }}
            >
              Contact Support
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentRetryModal;
