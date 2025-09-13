import React from 'react';
import './Skeleton.css';

export interface SkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular' | 'card' | 'avatar';
  width?: string | number;
  height?: string | number;
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
  lines?: number;
  style?: React.CSSProperties;
}

const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  className = '',
  animation = 'pulse',
  lines = 1,
  style: customStyle = {}
}) => {
  const baseClasses = 'skeleton';
  const variantClasses = `skeleton--${variant}`;
  const animationClasses = animation !== 'none' ? `skeleton--${animation}` : '';

  const classes = [
    baseClasses,
    variantClasses,
    animationClasses,
    className
  ].filter(Boolean).join(' ');

  const style: React.CSSProperties = { ...customStyle };
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (variant === 'text' && lines > 1) {
    return (
      <div className="skeleton-text-group">
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className={classes}
            style={{
              ...style,
              width: index === lines - 1 ? '60%' : width || '100%'
            }}
          />
        ))}
      </div>
    );
  }

  return <div className={classes} style={style} />;
};

export default Skeleton;
