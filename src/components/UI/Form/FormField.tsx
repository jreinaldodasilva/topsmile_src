import React from 'react';
import Input, { InputProps } from '../Input/Input';
import './FormField.css';

interface FormFieldProps extends Omit<InputProps, 'error'> {
  name: string;
  label?: string;
  error?: string | boolean;
  touched?: boolean;
  showError?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  name,
  error,
  touched,
  showError = true,
  ...props
}) => {
  const shouldShowError = showError && touched && error;
  const errorMessage = typeof error === 'string' ? error : undefined;

  return (
    <Input
      {...props}
      id={name}
      name={name}
      error={shouldShowError ? errorMessage : undefined}
      aria-invalid={shouldShowError ? 'true' : 'false'}
    />
  );
};

export default FormField;
