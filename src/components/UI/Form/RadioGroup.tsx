import React from 'react';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  name: string;
  label?: string;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  error?: string;
  helperText?: string;
  orientation?: 'horizontal' | 'vertical';
  onChange?: (value: string) => void;
  className?: string;
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  label,
  options,
  value,
  defaultValue,
  error,
  helperText,
  orientation = 'vertical',
  onChange,
  className = ''
}) => {
  const groupId = `radio-group-${name}`;
  const helperId = `${groupId}-helper`;
  const errorId = `${groupId}-error`;

  const baseClasses = 'radio-group';
  const orientationClasses = `radio-group--${orientation}`;
  const errorClasses = error ? 'radio-group--error' : '';

  const groupClasses = [
    baseClasses,
    orientationClasses,
    errorClasses,
    className
  ].filter(Boolean).join(' ');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event.target.value);
  };

  return (
    <div className={groupClasses} role="radiogroup" aria-labelledby={label ? groupId : undefined}>
      {label && (
        <label id={groupId} className="radio-group__label">
          {label}
        </label>
      )}

      <div className="radio-group__options">
        {options.map((option) => {
          const radioId = `${name}-${option.value}`;
          return (
            <div key={option.value} className="radio-option">
              <input
                type="radio"
                id={radioId}
                name={name}
                value={option.value}
                checked={value ? value === option.value : undefined}
                defaultChecked={defaultValue === option.value}
                disabled={option.disabled}
                onChange={handleChange}
                className="radio-option__input"
                aria-describedby={[
                  error ? errorId : null,
                  helperText ? helperId : null
                ].filter(Boolean).join(' ') || undefined}
              />
              <div className="radio-option__indicator"></div>
              <div className="radio-option__content">
                <label htmlFor={radioId} className="radio-option__label">
                  {option.label}
                </label>
                {option.description && (
                  <p className="radio-option__description">{option.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p id={errorId} className="radio-group__error" role="alert">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p id={helperId} className="radio-group__helper">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default RadioGroup;
