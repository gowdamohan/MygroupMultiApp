import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, success, leftIcon, rightIcon, helperText, className = '', type = 'text', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    return (
      <div className="w-full">
        {label && (
          <label className="block mb-2 text-gray-700">
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            type={inputType}
            className={`
              w-full px-4 py-3 border rounded-lg transition-all duration-200
              ${leftIcon ? 'pl-10' : ''}
              ${isPassword || rightIcon ? 'pr-10' : ''}
              ${error ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : ''}
              ${success ? 'border-success-500 focus:ring-success-500 focus:border-success-500' : ''}
              ${!error && !success ? 'border-gray-300 focus:ring-primary-500 focus:border-primary-500' : ''}
              focus:outline-none focus:ring-2
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          />
          
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
          
          {!isPassword && rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
          
          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-error-500">
              <AlertCircle size={20} />
            </div>
          )}
          
          {success && !error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-success-500">
              <CheckCircle size={20} />
            </div>
          )}
        </div>
        
        {error && (
          <p className="mt-1.5 text-sm text-error-600 flex items-center gap-1">
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
