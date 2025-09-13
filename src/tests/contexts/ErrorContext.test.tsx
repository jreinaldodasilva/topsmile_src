import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ErrorProvider, useError } from '../../contexts/ErrorContext';

// Mock timers
jest.useFakeTimers();

describe('ErrorContext', () => {
  let notificationId = '';

  const TestComponent = () => {
    const {
      notifications,
      showError,
      showWarning,
      showInfo,
      showSuccess,
      dismissNotification,
      clearAllNotifications,
      logError
    } = useError();

    return (
      <div>
        <div data-testid="notifications">
          {notifications.map(n => (
            <div key={n.id} data-testid={`notification-${n.id}`}>
              <span data-testid="notification-title">{n.title}</span>
              <span data-testid="notification-message">{n.message}</span>
              <button onClick={() => dismissNotification(n.id)}>Dismiss</button>
            </div>
          ))}
        </div>
        <button onClick={() => { notificationId = showError('Error', 'Error message'); }}>Show Error</button>
        <button onClick={() => { notificationId = showWarning('Warning', 'Warning message'); }}>Show Warning</button>
        <button onClick={() => { notificationId = showInfo('Info', 'Info message'); }}>Show Info</button>
        <button onClick={() => { notificationId = showSuccess('Success', 'Success message'); }}>Show Success</button>
        <button onClick={() => clearAllNotifications()}>Clear All</button>
        <button onClick={() => logError(new Error('Test error'), 'test-context')}>Log Error</button>
      </div>
    );
  };

  const setup = () => {
    render(
      <ErrorProvider>
        <TestComponent />
      </ErrorProvider>
    );
  };

  beforeEach(() => {
    // setup();
  });

  it('initial state is empty', () => {
    setup();
    expect(screen.queryByTestId(/notification-/)).toBeNull();
  });

  it('shows an error notification', () => {
    setup();
    fireEvent.click(screen.getByText('Show Error'));
    const notification = screen.getByTestId(`notification-${notificationId}`);
    expect(notification).toBeInTheDocument();
    expect(screen.getByTestId('notification-title')).toHaveTextContent('Error');
    expect(screen.getByTestId('notification-message')).toHaveTextContent('Error message');
  });

  it('shows a warning notification', () => {
    setup();
    fireEvent.click(screen.getByText('Show Warning'));
    const notification = screen.getByTestId(`notification-${notificationId}`);
    expect(notification).toBeInTheDocument();
    expect(screen.getByTestId('notification-title')).toHaveTextContent('Warning');
    expect(screen.getByTestId('notification-message')).toHaveTextContent('Warning message');
  });

  it('shows an info notification', () => {
    setup();
    fireEvent.click(screen.getByText('Show Info'));
    const notification = screen.getByTestId(`notification-${notificationId}`);
    expect(notification).toBeInTheDocument();
    expect(screen.getByTestId('notification-title')).toHaveTextContent('Info');
    expect(screen.getByTestId('notification-message')).toHaveTextContent('Info message');
  });

  it('shows a success notification', () => {
    setup();
    fireEvent.click(screen.getByText('Show Success'));
    const notification = screen.getByTestId(`notification-${notificationId}`);
    expect(notification).toBeInTheDocument();
    expect(screen.getByTestId('notification-title')).toHaveTextContent('Success');
    expect(screen.getByTestId('notification-message')).toHaveTextContent('Success message');
  });

  it('dismisses a notification', () => {
    setup();
    fireEvent.click(screen.getByText('Show Error'));
    let notification: HTMLElement | null = screen.getByTestId(`notification-${notificationId}`);
    expect(notification).toBeInTheDocument();

    fireEvent.click(screen.getByText('Dismiss'));
    notification = screen.queryByTestId(`notification-${notificationId}`);
    expect(notification).toBeNull();
  });

  it('clears all notifications', () => {
    setup();
    fireEvent.click(screen.getByText('Show Error'));
    fireEvent.click(screen.getByText('Show Warning'));
    expect(screen.getAllByTestId(/notification-/)).toHaveLength(2);

    fireEvent.click(screen.getByText('Clear All'));
    expect(screen.queryByTestId(/notification-/)).toBeNull();
  });

  it('auto-dismisses success notification', async () => {
    setup();
    fireEvent.click(screen.getByText('Show Success'));
    expect(screen.getByTestId(`notification-${notificationId}`)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.queryByTestId(`notification-${notificationId}`)).toBeNull();
    });
  });

  it('auto-dismisses info notification', async () => {
    setup();
    fireEvent.click(screen.getByText('Show Info'));
    expect(screen.getByTestId(`notification-${notificationId}`)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(7000);
    });

    await waitFor(() => {
      expect(screen.queryByTestId(`notification-${notificationId}`)).toBeNull();
    });
  });

  it('logs an error and shows a notification', () => {
    setup();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    fireEvent.click(screen.getByText('Log Error'));

    // It should show a user-friendly notification
    const notification = screen.getByTestId(/notification-/);
    expect(notification).toBeInTheDocument();
    expect(screen.getByTestId('notification-title')).toHaveTextContent('Erro no Sistema');
    expect(screen.getByTestId('notification-message')).toHaveTextContent('Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.');

    // It should log the error to the console in development
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});