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
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex justify-between items-start mb-3 sm:mb-4">
        <div>
          <h3 className="text-xs sm:text-sm font-medium text-gray-500">{title}</h3>
          <div className="mt-0.5 sm:mt-1 text-lg sm:text-2xl font-semibold text-gray-900 break-words">{value}</div>
        </div>
        <div className="p-2 sm:p-3 bg-indigo-50 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="flex items-center flex-wrap">
        <p className="text-xs sm:text-sm text-gray-500 truncate mr-2">
          {description}
        </p>
        {change !== undefined && (
          <div className={`flex items-center text-xs sm:text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? (
              <FiArrowUp className="mr-0.5 sm:mr-1 h-3 w-3 sm:h-4 sm:w-4" />
            ) : (
              <FiArrowDown className="mr-0.5 sm:mr-1 h-3 w-3 sm:h-4 sm:w-4" />
            )}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStats; 