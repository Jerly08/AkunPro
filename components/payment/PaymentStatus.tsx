import { FC } from 'react';
import Link from 'next/link';
import { PaymentStatus as PaymentStatusEnum } from '@prisma/client';

interface PaymentStatusProps {
  status: PaymentStatusEnum;
  paymentMethod: string;
  paymentUrl?: string;
  orderId: string;
}

const PaymentStatus: FC<PaymentStatusProps> = ({
  status,
  paymentMethod,
  paymentUrl,
  orderId
}) => {
  return (
    <div className="rounded-lg border p-5 space-y-4">
      <h3 className="text-lg font-semibold">Payment Status</h3>

      <div className="flex items-center">
        <span className="text-gray-600 w-28">Status:</span>
        <span className={`font-medium ${getStatusColor(status)}`}>
          {formatStatus(status)}
        </span>
      </div>

      <div className="flex items-center">
        <span className="text-gray-600 w-28">Method:</span>
        <span className="font-medium">{paymentMethod}</span>
      </div>

      <div className="flex items-center">
        <span className="text-gray-600 w-28">Order ID:</span>
        <span className="font-medium">{orderId}</span>
      </div>

      {status === PaymentStatusEnum.PENDING && paymentUrl && (
        <div className="pt-2">
          <a
            href={paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-md font-medium"
          >
            Continue Payment
          </a>
        </div>
      )}

      {status === PaymentStatusEnum.PAID && (
        <div className="pt-2">
          <Link 
            href={`/orders`}
            className="block w-full bg-green-600 hover:bg-green-700 text-white text-center py-2 px-4 rounded-md font-medium"
          >
            View Orders
          </Link>
        </div>
      )}

      {status === PaymentStatusEnum.FAILED && (
        <div className="pt-2">
          <Link
            href={`/checkout?orderId=${orderId}`}
            className="block w-full bg-red-600 hover:bg-red-700 text-white text-center py-2 px-4 rounded-md font-medium"
          >
            Try Again
          </Link>
        </div>
      )}
    </div>
  );
};

function getStatusColor(status: PaymentStatusEnum): string {
  switch (status) {
    case PaymentStatusEnum.PAID:
      return 'text-green-600';
    case PaymentStatusEnum.PENDING:
      return 'text-yellow-600';
    case PaymentStatusEnum.FAILED:
      return 'text-red-600';
    case PaymentStatusEnum.REFUNDED:
      return 'text-purple-600';
    default:
      return 'text-gray-600';
  }
}

function formatStatus(status: PaymentStatusEnum): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default PaymentStatus; 