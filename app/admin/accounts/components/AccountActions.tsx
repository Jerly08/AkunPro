import { useState } from 'react';
import { 
  FiTrash, 
  FiEdit, 
  FiArchive, 
  FiEye, 
  FiUserCheck, 
  FiUserX,
  FiUsers 
} from 'react-icons/fi';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface Account {
  id: string;
  type: 'NETFLIX' | 'SPOTIFY';
  accountEmail: string;
  isActive: boolean;
  isFamilyPlan?: boolean;
}

interface AccountActionsProps {
  account: Account;
  onReload: () => void;
}

const AccountActions = ({ account, onReload }: AccountActionsProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleStatus = async () => {
    if (!confirm(`${account.isActive ? 'Nonaktifkan' : 'Aktifkan'} akun ini?`)) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/accounts/${account.id}/toggle-status`, {
        method: 'POST',
      });
      
      if (response.ok) {
        toast.success(`Akun ${account.isActive ? 'dinonaktifkan' : 'diaktifkan'}`);
        onReload();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Gagal mengubah status akun');
      }
    } catch (error) {
      console.error('Error toggling account status:', error);
      toast.error('Terjadi kesalahan saat mengubah status akun');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col space-y-2">
      <Link
        href={`/admin/accounts/${account.id}`}
        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none"
      >
        <FiEye className="mr-2 -ml-0.5 h-4 w-4" />
        Detail
      </Link>
      
      <Link
        href={`/admin/accounts/${account.id}/edit`}
        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none"
      >
        <FiEdit className="mr-2 -ml-0.5 h-4 w-4" />
        Edit
      </Link>

      <button
        onClick={toggleStatus}
        disabled={isLoading}
        className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md focus:outline-none ${
          account.isActive
            ? 'text-amber-700 bg-amber-100 hover:bg-amber-200'
            : 'text-blue-700 bg-blue-100 hover:bg-blue-200'
        }`}
      >
        {account.isActive ? (
          <>
            <FiUserX className="mr-2 -ml-0.5 h-4 w-4" />
            Nonaktifkan
          </>
        ) : (
          <>
            <FiUserCheck className="mr-2 -ml-0.5 h-4 w-4" />
            Aktifkan
          </>
        )}
      </button>
    </div>
  );
};

export default AccountActions; 