import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
  animate?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  className = '',
  padding = 'md',
  hover = false,
  onClick,
  animate = false
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8'
  };

  const CardWrapper = animate ? motion.div : 'div';
  const animationProps = animate ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  } : {};

  return (
    <CardWrapper
      {...animationProps}
      className={`
        bg-white rounded-lg border border-gray-200 shadow-sm
        ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Header */}
      {(title || subtitle || headerAction) && (
        <div className={`border-b border-gray-200 ${paddingClasses[padding]}`}>
          <div className="flex items-start justify-between">
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-500 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            {headerAction && (
              <div className="ml-4">
                {headerAction}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className={paddingClasses[padding]}>
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className={`border-t border-gray-200 ${paddingClasses[padding]}`}>
          {footer}
        </div>
      )}
    </CardWrapper>
  );
};

