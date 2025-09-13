import React, { useState } from 'react';
import Card from '../../components/UI/Card/Card';
import Modal from '../../components/UI/Modal/Modal';
import ToastContainer from '../../components/UI/Toast/ToastContainer';
import Button from '../../components/UI/Button/Button';
import Select from '../../components/UI/Select';
import { ToastProps } from '../../components/UI/Toast/Toast';
import { SelectOption } from '../../components/UI/Select';
import './TestComponents.css';

const TestComponents: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const [selectedValue, setSelectedValue] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  const selectOptions: SelectOption[] = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3', disabled: true },
    { value: 'option4', label: 'Option 4' },
  ];

  const sizeOptions: SelectOption[] = [
    { value: 'sm', label: 'Small' },
    { value: 'md', label: 'Medium' },
    { value: 'lg', label: 'Large' },
  ];

  const addToast = (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => {
    const id = Date.now().toString();
    const newToast: ToastProps = {
      id,
      type,
      title,
      message,
      duration: 5000,
      onClose: removeToast
    };

    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showToastWithAction = () => {
    const id = Date.now().toString();
    const newToast: ToastProps = {
      id,
      type: 'info',
      title: 'Action Required',
      message: 'This toast has an action button',
      duration: 10000,
      onClose: removeToast,
      action: {
        label: 'Click me',
        onClick: () => {
          addToast('success', 'Action completed successfully!');
          removeToast(id);
        }
      }
    };

    setToasts(prev => [...prev, newToast]);
  };

  return (
    <div className="test-components">
      <div className="container">
        <h1>Component Testing Page</h1>

        {/* Card Variants */}
        <section className="test-section">
          <h2>Card Component Variants</h2>
          <div className="cards-grid">
            <Card variant="default" padding="md">
              <h3>Default Card</h3>
              <p>This is a default card with standard styling.</p>
            </Card>

            <Card variant="elevated" padding="md">
              <h3>Elevated Card</h3>
              <p>This card has enhanced shadow for depth.</p>
            </Card>

            <Card variant="outlined" padding="md">
              <h3>Outlined Card</h3>
              <p>This card uses only border styling.</p>
            </Card>

            <Card variant="filled" padding="md">
              <h3>Filled Card</h3>
              <p>This card has a filled background.</p>
            </Card>
          </div>
        </section>

        {/* Interactive Cards */}
        <section className="test-section">
          <h2>Interactive Cards</h2>
          <div className="cards-grid">
            <Card variant="default" padding="md" interactive>
              <h3>Interactive Card</h3>
              <p>Hover over this card to see the interaction effect.</p>
            </Card>

            <Card variant="elevated" padding="md" interactive>
              <h3>Elevated Interactive</h3>
              <p>This interactive card has enhanced elevation.</p>
            </Card>
          </div>
        </section>

        {/* Modal Test */}
        <section className="test-section">
          <h2>Modal Component</h2>
          <Button onClick={() => setIsModalOpen(true)}>
            Open Modal
          </Button>
        </section>

        {/* Select Component Tests */}
        <section className="test-section">
          <h2>Select Component</h2>
          <div className="select-tests">
            <div className="select-test-item">
              <h3>Basic Select</h3>
              <Select
                label="Choose an option"
                options={selectOptions}
                value={selectedValue}
                onChange={(e) => setSelectedValue(e.target.value)}
                placeholder="Select an option"
                helperText="This is a basic select component"
              />
            </div>

            <div className="select-test-item">
              <h3>Select with Error</h3>
              <Select
                label="Choose with error"
                options={selectOptions}
                error="This field is required"
                placeholder="Select an option"
              />
            </div>

            <div className="select-test-item">
              <h3>Select Sizes</h3>
              <Select
                label="Select size"
                options={sizeOptions}
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="select-group--sm"
                placeholder="Small size"
              />
              <br />
              <Select
                label="Select size"
                options={sizeOptions}
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="select-group--md"
                placeholder="Medium size"
              />
              <br />
              <Select
                label="Select size"
                options={sizeOptions}
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="select-group--lg"
                placeholder="Large size"
              />
            </div>
          </div>
        </section>

        {/* Toast Tests */}
        <section className="test-section">
          <h2>Toast Notifications</h2>
          <div className="toast-buttons">
            <Button onClick={() => addToast('success', 'Operation completed successfully!')}>
              Success Toast
            </Button>
            <Button onClick={() => addToast('error', 'An error occurred while processing your request.')}>
              Error Toast
            </Button>
            <Button onClick={() => addToast('warning', 'Please review your input before proceeding.')}>
              Warning Toast
            </Button>
            <Button onClick={() => addToast('info', 'Here is some useful information.')}>
              Info Toast
            </Button>
            <Button onClick={showToastWithAction}>
              Toast with Action
            </Button>
          </div>
        </section>

        {/* Size Variants */}
        <section className="test-section">
          <h2>Card Size Variants</h2>
          <div className="cards-grid">
            <Card variant="default" size="sm" padding="sm">
              <h4>Small Card</h4>
              <p>Compact card with smaller padding.</p>
            </Card>

            <Card variant="default" size="md" padding="md">
              <h4>Medium Card</h4>
              <p>Standard card size.</p>
            </Card>

            <Card variant="default" size="lg" padding="lg">
              <h4>Large Card</h4>
              <p>Larger card with more padding.</p>
            </Card>
          </div>
        </section>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Test Modal"
        description="This is a test modal to verify the Modal component functionality."
        size="md"
      >
        <div>
          <p>This modal demonstrates the new Modal component with:</p>
          <ul>
            <li>Proper focus management</li>
            <li>Keyboard navigation (ESC to close)</li>
            <li>Backdrop click to close</li>
            <li>Accessible ARIA attributes</li>
            <li>Responsive design</li>
          </ul>
          <div style={{ marginTop: '1rem' }}>
            <Button onClick={() => setIsModalOpen(false)}>
              Close Modal
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} position="top-right" />
    </div>
  );
};

export default TestComponents;
