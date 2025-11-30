import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'flat' | 'elevated' | 'outlined' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  padding = 'md',
  hover = false,
  className = '',
  onClick
}) => {
  const variants = {
    flat: 'bg-white',
    elevated: 'bg-white shadow-lg',
    outlined: 'bg-white border-2 border-gray-200',
    glass: 'glass-effect shadow-xl'
  };
  
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };
  
  const hoverEffect = hover 
    ? 'transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl cursor-pointer' 
    : '';
  
  const clickable = onClick ? 'cursor-pointer' : '';
  
  return (
    <div
      className={`rounded-2xl ${variants[variant]} ${paddings[padding]} ${hoverEffect} ${clickable} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
