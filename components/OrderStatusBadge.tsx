import React from 'react';
import { FiClock, FiCheck, FiXCircle, FiPackage, FiFileText } from 'react-icons/fi';

type OrderStatus = 'PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
  paymentProofUploaded?: boolean;
}

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, size = 'md', paymentProofUploaded = false }) => {
  // Status configurations (color, text, icon)
  const statusConfig = {
    PENDING: {
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-200',
      label: 'Menunggu Verifikasi Pembayaran',
      icon: <FiClock />
    },
    PAID: {
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-200',
      label: 'Lunas',
      icon: <FiCheck />
    },
    COMPLETED: {
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-200',
      label: 'Selesai',
      icon: <FiPackage />
    },
    CANCELLED: {
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-200',
      label: 'Dibatalkan',
      icon: <FiXCircle />
    }
  };

  // Size configurations
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <div className={`
      inline-flex items-center 
      ${sizeClasses[size]} 
      ${config.bgColor} 
      ${config.textColor} 
      border ${config.borderColor}
      rounded-full font-medium
    `}>
      <span className="mr-1">{React.cloneElement(config.icon, { size: size === 'sm' ? 12 : size === 'md' ? 14 : 16 })}</span>
      <span>{config.label}</span>
    </div>
  );
};

export default OrderStatusBadge; 