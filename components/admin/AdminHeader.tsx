import Link from 'next/link';
import { FiChevronLeft } from 'react-icons/fi';

interface AdminHeaderProps {
  title: string;
  description?: string;
  showBackButton?: boolean;
  backUrl?: string;
  backHref?: string;
}

const AdminHeader = ({ 
  title, 
  description,
  showBackButton = false, 
  backUrl = '/admin',
  backHref
}: AdminHeaderProps) => {
  // Use backHref if provided, otherwise fallback to backUrl
  const linkHref = backHref || backUrl;
  // If backHref is provided, always show back button
  const shouldShowBack = backHref ? true : showBackButton;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {shouldShowBack && (
            <Link
              href={linkHref}
              className="mr-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <FiChevronLeft className="h-5 w-5 text-gray-700" />
            </Link>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
          </div>
        </div>
      </div>
      <div className="mt-2 h-1 w-20 bg-indigo-600 rounded-full"></div>
    </div>
  );
};

export default AdminHeader; 