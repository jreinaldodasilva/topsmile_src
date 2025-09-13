import React from 'react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
  indeterminate?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  description,
  error,
  indeterminate = false,
  className = '',
  id,
  ...props
}) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${checkboxId}-error`;

  const baseClasses = 'checkbox-group';
  const errorClasses = error ? 'checkbox-group--error' : '';

  const groupClasses = [
    baseClasses,
    errorClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={groupClasses}>
      <div className="checkbox__container">
        <input
          type="checkbox"
          id={checkboxId}
          className="checkbox__input"
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? 'true' : undefined}
          ref={(input) => {
            if (input) input.indeterminate = indeterminate;
          }}
          {...props}
        />
        <div className="checkbox__indicator">
          {indeterminate ? (
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 8h8v1H4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
            </svg>
          )}
        </div>
        {(label || description) && (
          <div className="checkbox__content">
            {label && (
              <label htmlFor={checkboxId} className="checkbox__label">
                {label}
              </label>
            )}
            {description && (
              <p className="checkbox__description">{description}</p>
            )}
          </div>
        )}
      </div>

      {error && (
        <p id={errorId} className="checkbox__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default Checkbox;
