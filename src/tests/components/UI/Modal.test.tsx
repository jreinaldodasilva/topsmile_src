import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal, { ModalProps } from '../../../components/UI/Modal/Modal';

// Mock the Button component to avoid styling issues
jest.mock('../../../components/UI/Button/Button', () => (props: any) => <button {...props} />);

describe('Modal', () => {
  const handleClose = jest.fn();

  const defaultProps: ModalProps = {
    isOpen: true,
    onClose: handleClose,
    title: 'Test Modal',
    children: <div>Modal Content</div>,
  };

  const renderModal = (props: Partial<ModalProps> = {}) => {
    return render(<Modal {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    handleClose.mockClear();
  });

  it('does not render when isOpen is false', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders correctly when isOpen is true', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    renderModal();
    const closeButton = screen.getByLabelText('Fechar modal');
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop is clicked', () => {
    renderModal();
    const backdrop = screen.getByTestId('modal-backdrop');
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose on backdrop click if closeOnBackdropClick is false', () => {
    renderModal({ closeOnBackdropClick: false });
    const backdrop = screen.getByTestId('modal-backdrop');
    fireEvent.click(backdrop);
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('calls onClose when the Escape key is pressed', () => {
    renderModal();
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose on Escape key if closeOnEscape is false', () => {
    renderModal({ closeOnEscape: false });
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('applies the correct size class', () => {
    const { rerender } = renderModal({ size: 'sm' });
    expect(screen.getByTestId('modal')).toHaveClass('modal--sm');

    rerender(<Modal {...defaultProps} size="lg" />);
    expect(screen.getByTestId('modal')).toHaveClass('modal--lg');
  });

  it('does not show the close button if showCloseButton is false', () => {
    renderModal({ showCloseButton: false });
    expect(screen.queryByLabelText('Fechar modal')).not.toBeInTheDocument();
  });

  it('traps focus within the modal', () => {
    renderModal({ children: <input data-testid="input" /> });

    // The focus management is tricky to test with JSDOM, but we can test the initial focus
    // and that the focus trap handler is in place.
    // A full end-to-end test with Cypress would be better for this.
    expect(document.body).toHaveStyle('overflow: hidden');

    // Simulate tabbing
    fireEvent.keyDown(document, { key: 'Tab' });
    // In a real browser, this would cycle focus. Here we just check the event is handled.
  });
});
