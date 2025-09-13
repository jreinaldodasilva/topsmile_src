// src/components/UI/Button/Button.tsx
import React from 'react';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  children,
  ...props
}) => {
  const baseClasses = 'btn';
  const variantClasses = `btn--${variant}`;
  const sizeClasses = `btn--${size}`;
  const fullWidthClasses = fullWidth ? 'btn--full-width' : '';
  const loadingClasses = loading ? 'btn--loading' : '';
  const disabledClasses = (disabled || loading) ? 'btn--disabled' : '';
  
  const classes = [
    baseClasses,
    variantClasses,
    sizeClasses,
    fullWidthClasses,
    loadingClasses,
    disabledClasses,
    className
  ].filter(Boolean).join(' ');

  const LoadingSpinner = () => (
    <svg className="btn__spinner" data-testid="loading-spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle
        className="btn__spinner-circle"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="btn__spinner-path"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-pressed={props['aria-pressed'] || undefined}
      {...props}
    >
      {loading && <LoadingSpinner />}
      {icon && iconPosition === 'left' && !loading && (
        <span className="btn__icon btn__icon--left" data-testid="icon-left">{icon}</span>
      )}
      <span className={loading ? 'btn__content--loading' : 'btn__content'}>
        {children}
      </span>
      {icon && iconPosition === 'right' && !loading && (
        <span className="btn__icon btn__icon--right" data-testid="icon-right">{icon}</span>
      )}
    </button>
  );
};

export default Button;