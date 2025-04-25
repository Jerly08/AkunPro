import { ReactNode } from 'react';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';

interface AdminStatsProps {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
  change?: number;
}

const AdminStats = ({ title, value, description, icon, change }: AdminStatsProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
        </div>
        <div className="p-3 bg-indigo-50 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="flex items-center">
        <p className="text-sm text-gray-500 truncate mr-2">
          {description}
        </p>
        {change !== undefined && (
          <div className={`flex items-center text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? (
              <FiArrowUp className="mr-1 h-4 w-4" />
            ) : (
              <FiArrowDown className="mr-1 h-4 w-4" />
            )}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStats; 