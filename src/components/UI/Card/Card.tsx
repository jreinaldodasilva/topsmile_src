import React from 'react';
import './Card.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  padding?: 'sm' | 'md' | 'lg' | 'none';
  interactive?: boolean;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  variant = 'default',
  size = 'md',
  padding = 'md',
  interactive = false,
  className = '',
  children,
  ...props
}) => {
  const baseClasses = 'card';
  const variantClasses = `card--${variant}`;
  const sizeClasses = `card--${size}`;
  const paddingClasses = padding !== 'none' ? `card--padding-${padding}` : '';
  const interactiveClasses = interactive ? 'card--interactive' : '';

  const classes = [
    baseClasses,
    variantClasses,
    sizeClasses,
    paddingClasses,
    interactiveClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;
