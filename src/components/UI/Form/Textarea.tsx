import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
  loading?: boolean;
  success?: boolean;
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  resize = 'vertical',
  loading = false,
  success = false,
  className = '',
  required,
  id,
  ...props
}) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  const helperId = `${textareaId}-helper`;
  const errorId = `${textareaId}-error`;

  const baseClasses = 'textarea-group';
  const errorClasses = error ? 'textarea-group--error' : '';
  const successClasses = success && !error ? 'textarea-group--success' : '';
  const loadingClasses = loading ? 'textarea-group--loading' : '';

  const groupClasses = [
    baseClasses,
    errorClasses,
    successClasses,
    loadingClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={groupClasses}>
      {label && (
        <label htmlFor={textareaId} className="textarea__label">
          {label}
          {required && <span className="textarea__required">*</span>}
        </label>
      )}

      <div className="textarea__container">
        <textarea
          id={textareaId}
          className={`textarea__field textarea__field--resize-${resize}`}
          aria-describedby={[
            error ? errorId : null,
            helperText ? helperId : null
          ].filter(Boolean).join(' ') || undefined}
          aria-invalid={error ? 'true' : undefined}
          required={required}
          {...props}
        />

        <div className="textarea__icons">
          {loading && (
            <svg className="textarea__spinner" viewBox="0 0 20 20" fill="none">
              <circle
                cx="10"
                cy="10"
                r="8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="textarea__spinner-circle"
              />
            </svg>
          )}
          {success && !error && !loading && (
            <svg className="textarea__success-icon" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {error && !loading && (
            <svg className="textarea__error-icon" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>

      {error && (
        <p id={errorId} className="textarea__error" role="alert">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p id={helperId} className="textarea__helper">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Textarea;
