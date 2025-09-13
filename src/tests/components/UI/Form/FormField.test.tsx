import React from 'react';
import { render, screen } from '@testing-library/react';
import FormField from '../../../../components/UI/Form/FormField';

// Mock the Input component
jest.mock('../../../../components/UI/Input/Input', () => (props: any) => {
  return <input data-testid="input" {...props} />;
});

describe('FormField', () => {
  const defaultProps = {
    name: 'test-field',
    label: 'Test Field',
  };

  it('renders an input with a label', () => {
    render(<FormField {...defaultProps} />);
    const input = screen.getByTestId('input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('id', 'test-field');
    expect(input).toHaveAttribute('name', 'test-field');
  });

  it('displays an error message when touched and error are set', () => {
    render(<FormField {...defaultProps} touched={true} error="Test error" />);
    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('error', 'Test error');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not display an error message if touched is false', () => {
    render(<FormField {...defaultProps} touched={false} error="Test error" />);
    const input = screen.getByTestId('input');
    expect(input).not.toHaveAttribute('error');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('does not display an error message if error is not set', () => {
    render(<FormField {...defaultProps} touched={true} />);
    const input = screen.getByTestId('input');
    expect(input).not.toHaveAttribute('error');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('handles boolean error prop', () => {
    render(<FormField {...defaultProps} touched={true} error={true} />);
    const input = screen.getByTestId('input');
    expect(input).not.toHaveAttribute('error');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('passes other props to the Input component', () => {
    render(<FormField {...defaultProps} placeholder="Enter text" />);
    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('placeholder', 'Enter text');
  });
});
