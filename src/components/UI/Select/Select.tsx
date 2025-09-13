import React from 'react';
import './Select.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  loading?: boolean;
  success?: boolean;
}

const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  options,
  placeholder,
  loading = false,
  success = false,
  className = '',
  required,
  id,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  const helperId = `${selectId}-helper`;
  const errorId = `${selectId}-error`;

  const baseClasses = 'select-group';
  const errorClasses = error ? 'select-group--error' : '';
  const successClasses = success && !error ? 'select-group--success' : '';
  const loadingClasses = loading ? 'select-group--loading' : '';

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
        <label htmlFor={selectId} className="select__label">
          {label}
          {required && <span className="select__required">*</span>}
        </label>
      )}

      <div className="select__container">
        <select
          id={selectId}
          className="select__field"
          aria-describedby={[
            error ? errorId : null,
            helperText ? helperId : null
          ].filter(Boolean).join(' ') || undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-required={required ? 'true' : undefined}
          aria-expanded="false"
          role="combobox"
          required={required}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(option => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        <div className="select__icons">
          {loading && (
            <svg className="select__spinner" viewBox="0 0 20 20" fill="none">
              <circle
                cx="10"
                cy="10"
                r="8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="select__spinner-circle"
              />
            </svg>
          )}
          {success && !error && !loading && (
            <svg className="select__success-icon" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {error && !loading && (
            <svg className="select__error-icon" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <svg className="select__chevron" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {error && (
        <p id={errorId} className="select__error" role="alert">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p id={helperId} className="select__helper">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Select;
