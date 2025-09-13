import React from 'react';

interface FormGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

const FormGrid: React.FC<FormGridProps> = ({
  children,
  columns = 2,
  gap = 'md',
  className = ''
}) => {
  const gridClasses = [
    'form-grid',
    `form-grid--columns-${columns}`,
    `form-grid--gap-${gap}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
};

export default FormGrid;
