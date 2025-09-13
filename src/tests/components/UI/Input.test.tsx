import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Input, { InputProps } from '../../../components/UI/Input/Input';

describe('Input', () => {
  const defaultProps: InputProps = {
    id: 'test-input',
    label: 'Test Input',
  };

  const renderInput = (props: Partial<InputProps> = {}) => {
    return render(<Input {...defaultProps} {...props} />);
  };

  it('renders with a label', () => {
    renderInput();
    expect(screen.getByLabelText('Test Input')).toBeInTheDocument();
  });

  it('renders with helper text', () => {
    renderInput({ helperText: 'Some helper text' });
    expect(screen.getByText('Some helper text')).toBeInTheDocument();
  });

  it('renders with an error message', () => {
    renderInput({ error: 'This is an error' });
    expect(screen.getByText('This is an error')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('handles user input', () => {
    renderInput();
    const input = screen.getByLabelText('Test Input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test' } });
    expect(input.value).toBe('test');
  });

  it('shows left and right icons', () => {
    renderInput({ 
      leftIcon: <span data-testid="left-icon">L</span>, 
      rightIcon: <span data-testid="right-icon">R</span> 
    });
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('shows a loading spinner', () => {
    renderInput({ loading: true });
    expect(screen.getByTestId('input-spinner')).toBeInTheDocument();
  });

  it('shows a success icon', () => {
    renderInput({ success: true });
    expect(screen.getByTestId('input-success-icon')).toBeInTheDocument();
  });

  it('clears the input when clear button is clicked', () => {
    const handleClear = jest.fn();
    renderInput({ value: 'test', showClearButton: true, onClear: handleClear });
    const clearButton = screen.getByLabelText('Clear input');
    fireEvent.click(clearButton);
    expect(handleClear).toHaveBeenCalledTimes(1);
  });

  it('is disabled', () => {
    renderInput({ disabled: true });
    const input = screen.getByLabelText('Test Input');
    expect(input).toBeDisabled();
  });

  it('applies variant and size classes', () => {
    renderInput({ variant: 'filled', size: 'lg' });
    const inputGroup = screen.getByTestId('input-group');
    expect(inputGroup).toHaveClass('input-group--filled input-group--lg');
  });

  it('handles floating label', () => {
    renderInput({ variant: 'floating', value: 'test' });
    const inputGroup = screen.getByTestId('input-group');
    expect(inputGroup).toHaveClass('input-group--has-value');
  });
});
