import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Toast, { ToastProps } from '../../../components/UI/Toast/Toast';

// Mock timers
jest.useFakeTimers();

describe('Toast', () => {
  const handleClose = jest.fn();

  const defaultProps: ToastProps = {
    id: 'toast-1',
    type: 'info',
    message: 'Test message',
    onClose: handleClose,
  };

  const renderToast = (props: Partial<ToastProps> = {}) => {
    return render(<Toast {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    handleClose.mockClear();
  });

  it('renders with title and message', () => {
    renderToast({ title: 'Test Title' });
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it.each(['success', 'error', 'warning', 'info'] as const)(
    'renders the correct icon for type %s',
    (type) => {
      renderToast({ type });
      expect(screen.getByTestId('toast-icon')).toBeInTheDocument();
    }
  );

  it('calls onClose when the close button is clicked', () => {
    renderToast();
    const closeButton = screen.getByLabelText('Fechar notificação');
    fireEvent.click(closeButton);
    
    act(() => {
      jest.advanceTimersByTime(300); // Wait for exit animation
    });

    expect(handleClose).toHaveBeenCalledWith('toast-1');
  });

  it('calls onClose after the duration', () => {
    renderToast({ duration: 3000 });
    
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    act(() => {
      jest.advanceTimersByTime(300); // Wait for exit animation
    });

    expect(handleClose).toHaveBeenCalledWith('toast-1');
  });

  it('does not call onClose automatically if duration is 0', () => {
    renderToast({ duration: 0 });
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('renders an action button and handles click', () => {
    const handleActionClick = jest.fn();
    renderToast({ 
      action: { 
        label: 'Undo', 
        onClick: handleActionClick 
      } 
    });

    const actionButton = screen.getByRole('button', { name: 'Undo' });
    fireEvent.click(actionButton);
    expect(handleActionClick).toHaveBeenCalledTimes(1);
  });
});
