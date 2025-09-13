import React from 'react';

interface FormActionsProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right' | 'space-between';
  className?: string;
}

const FormActions: React.FC<FormActionsProps> = ({
  children,
  align = 'right',
  className = ''
}) => {
  const actionsClasses = [
    'form-actions',
    `form-actions--${align}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={actionsClasses}>
      {children}
    </div>
  );
};

export default FormActions;
