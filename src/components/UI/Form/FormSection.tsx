import React from 'react';

interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className = ''
}) => {
  return (
    <div className={`form-section ${className}`}>
      {(title || description) && (
        <div className="form-section__header">
          {title && <h3 className="form-section__title">{title}</h3>}
          {description && <p className="form-section__description">{description}</p>}
        </div>
      )}
      <div className="form-section__content">
        {children}
      </div>
    </div>
  );
};

export default FormSection;
