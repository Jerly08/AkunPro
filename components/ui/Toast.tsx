'use client';

import React from 'react';
import { FiCheck, FiInfo, FiAlertCircle, FiX } from 'react-icons/fi';
import { twMerge } from 'tailwind-merge';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  onDismiss: (id: string) => void;
}

const Toast = ({
  id,
  title,
  description,
  variant = 'default',
  onDismiss,
}: ToastProps) => {
  // Base styles for all toasts
  const baseStyles = 'p-4 rounded-lg shadow-md text-white w-full transform transition-all duration-300 ease-in-out';
  
  // Variant-specific styles and icons
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          background: 'bg-green-600',
          icon: <FiCheck className="h-5 w-5" />,
        };
      case 'error':
        return {
          background: 'bg-red-600',
          icon: <FiAlertCircle className="h-5 w-5" />,
        };
      case 'warning':
        return {
          background: 'bg-yellow-500',
          icon: <FiAlertCircle className="h-5 w-5" />,
        };
      case 'info':
        return {
          background: 'bg-blue-600',
          icon: <FiInfo className="h-5 w-5" />,
        };
      default:
        return {
          background: 'bg-gray-800',
          icon: <FiInfo className="h-5 w-5" />,
        };
    }
  };
  
  const { background, icon } = getVariantStyles();
  
  return (
    <div className={twMerge(baseStyles, background)}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{title}</h4>
          {description && (
            <p className="text-xs mt-1 opacity-90">{description}</p>
          )}
        </div>
        <button
          onClick={() => onDismiss(id)}
          className="flex-shrink-0 ml-2 text-white opacity-70 hover:opacity-100 focus:outline-none"
          aria-label="Tutup notifikasi"
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default Toast; 