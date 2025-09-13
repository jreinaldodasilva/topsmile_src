// src/components/UI/Input/Input.tsx
import React, { useState, useId, forwardRef } from 'react';
import './Input.css';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'floating';
  loading?: boolean;
  success?: boolean;
  onClear?: () => void;
  showClearButton?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  size = 'md',
  variant = 'default',
  loading = false,
  success = false,
  onClear,
  showClearButton = false,
  className = '',
  id,
  value,
  disabled,
  required,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(Boolean(value));
  const inputId = useId();
  const actualId = id || inputId;
  const helperId = `${actualId}-helper`;
  const errorId = `${actualId}-error`;

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    props.onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(Boolean(e.target.value));
    props.onChange?.(e);
  };

  const handleClear = () => {
    setHasValue(false);
    onClear?.();
  };

  const baseClasses = 'input-group';
  const variantClasses = `input-group--${variant}`;
  const sizeClasses = `input-group--${size}`;
  const focusClasses = isFocused ? 'input-group--focused' : '';
  const errorClasses = error ? 'input-group--error' : '';
  const successClasses = success && !error ? 'input-group--success' : '';
  const disabledClasses = disabled ? 'input-group--disabled' : '';
  const hasValueClasses = hasValue || isFocused ? 'input-group--has-value' : '';

  const groupClasses = [
    baseClasses,
    variantClasses,
    sizeClasses,
    focusClasses,
    errorClasses,
    successClasses,
    disabledClasses,
    hasValueClasses,
    className
  ].filter(Boolean).join(' ');

  const LoadingSpinner = () => (
    <svg className="input__spinner" data-testid="input-spinner" viewBox="0 0 20 20" fill="none">
      <circle
        cx="10"
        cy="10"
        r="8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="input__spinner-circle"
      />
    </svg>
  );

  const ClearButton = () => (
    <button
      type="button"
      className="input__clear"
      onClick={handleClear}
      aria-label="Clear input"
      tabIndex={-1}
    >
      <svg viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );

  const SuccessIcon = () => (
    <svg className="input__success-icon" data-testid="input-success-icon" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );

  const ErrorIcon = () => (
    <svg className="input__error-icon" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  );

  return (
    <div className={groupClasses} data-testid="input-group">
      {label && variant !== 'floating' && (
        <label htmlFor={actualId} className="input__label">
          {label}
          {required && <span className="input__required">*</span>}
        </label>
      )}
      
      <div className="input__container">
        {leftIcon && (
          <div className="input__icon input__icon--left">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          id={actualId}
          className="input__field"
          value={value}
          disabled={disabled}
          required={required}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          aria-describedby={[
            error ? errorId : null,
            helperText ? helperId : null
          ].filter(Boolean).join(' ') || undefined}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        />
        
        {variant === 'floating' && label && (
          <label htmlFor={actualId} className="input__label input__label--floating">
            {label}
            {required && <span className="input__required">*</span>}
          </label>
        )}
        
        <div className="input__icons-right">
          {loading && <LoadingSpinner />}
          {success && !error && !loading && <SuccessIcon />}
          {error && !loading && <ErrorIcon />}
          {showClearButton && hasValue && !loading && !disabled && (
            <ClearButton />
          )}
          {rightIcon && !loading && !success && !error && !showClearButton && (
            <div className="input__icon input__icon--right">
              {rightIcon}
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <p id={errorId} className="input__error" role="alert">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p id={helperId} className="input__helper">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;