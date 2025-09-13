import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button, { ButtonProps } from '../../../components/UI/Button/Button';

describe('Button', () => {
  const renderButton = (props: Partial<ButtonProps> = {}) => {
    const defaultProps: ButtonProps = {
      children: 'Click me',
      onClick: jest.fn(),
    };
    return render(<Button {...defaultProps} {...props} />);
  };

  it('renders with default props', () => {
    renderButton();
    const button = screen.getByRole('button', { name: /Click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('btn btn--primary btn--md');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    renderButton({ onClick: handleClick });
    const button = screen.getByRole('button', { name: /Click me/i });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    const handleClick = jest.fn();
    renderButton({ disabled: true, onClick: handleClick });
    const button = screen.getByRole('button', { name: /Click me/i });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('is disabled when loading prop is true', () => {
    const handleClick = jest.fn();
    renderButton({ loading: true, onClick: handleClick });
    const button = screen.getByRole('button', { name: /Click me/i });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows a loading spinner when loading', () => {
    renderButton({ loading: true });
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('applies variant classes correctly', () => {
    const variants: ButtonProps['variant'][] = ['primary', 'secondary', 'outline', 'ghost', 'destructive'];
    variants.forEach(variant => {
      const { unmount } = renderButton({ variant });
      const button = screen.getByRole('button', { name: /Click me/i });
      expect(button).toHaveClass(`btn--${variant}`);
      unmount();
    });
  });

  it('applies size classes correctly', () => {
    const sizes: ButtonProps['size'][] = ['sm', 'md', 'lg'];
    sizes.forEach(size => {
      const { unmount } = renderButton({ size });
      const button = screen.getByRole('button', { name: /Click me/i });
      expect(button).toHaveClass(`btn--${size}`);
      unmount();
    });
  });

  it('applies fullWidth class correctly', () => {
    renderButton({ fullWidth: true });
    const button = screen.getByRole('button', { name: /Click me/i });
    expect(button).toHaveClass('btn--full-width');
  });

  it('renders an icon on the left by default', () => {
    const icon = <span data-testid="icon">Icon</span>;
    renderButton({ icon });
    const button = screen.getByRole('button', { name: /Click me/i });
    const iconEl = screen.getByTestId('icon');
    expect(button).toContainElement(iconEl);
    expect(screen.getByTestId('icon-left')).toHaveClass('btn__icon--left');
  });

  it('renders an icon on the right', () => {
    const icon = <span data-testid="icon">Icon</span>;
    renderButton({ icon, iconPosition: 'right' });
    const button = screen.getByRole('button', { name: /Click me/i });
    const iconEl = screen.getByTestId('icon');
    expect(button).toContainElement(iconEl);
    expect(screen.getByTestId('icon-right')).toHaveClass('btn__icon--right');
  });

  it('does not render icon when loading', () => {
    const icon = <span data-testid="icon">Icon</span>;
    renderButton({ icon, loading: true });
    const iconEl = screen.queryByTestId('icon');
    expect(iconEl).not.toBeInTheDocument();
  });
});
