'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiEdit2, FiTrash2, FiEye, FiPlay, FiMusic } from 'react-icons/fi';

interface Account {
  id: string;
  type: string;
  accountEmail: string;
  price: number;
  warranty: number;
  isActive: boolean;
  createdAt: Date;
  seller: {
    name: string;
  };
}

interface AccountsTableProps {
  accounts: Account[];
}

const AccountsTable = ({ accounts }: AccountsTableProps) => {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  
  const toggleSelectAll = () => {
    if (selectedRows.length === accounts.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(accounts.map(account => account.id));
    }
  };
  
  const toggleSelectRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'NETFLIX':
        return <FiPlay className="h-4 w-4 text-red-600" />;
      case 'SPOTIFY':
        return <FiMusic className="h-4 w-4 text-green-600" />;
      default:
        return null;
    }
  };
  
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'NETFLIX':
        return 'Netflix';
      case 'SPOTIFY':
        return 'Spotify';
      default:
        return type;
    }
  };
  
  const getTypeClassName = (type: string) => {
    switch (type) {
      case 'NETFLIX':
        return 'bg-red-100 text-red-800';
      case 'SPOTIFY':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Aktif</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Nonaktif</span>;
  };

  if (accounts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Belum ada akun yang tersedia</p>
        <Link 
          href="/admin/accounts/create" 
          className="inline-flex items-center mt-4 text-indigo-600 hover:underline"
        >
          Tambah Akun Baru
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  checked={selectedRows.length === accounts.length && accounts.length > 0}
                  onChange={toggleSelectAll}
                />
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tipe
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Harga
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Garansi
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tanggal Dibuat
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {accounts.map((account) => (
            <tr 
              key={account.id}
              className={selectedRows.includes(account.id) ? 'bg-indigo-50' : 'hover:bg-gray-50'}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    checked={selectedRows.includes(account.id)}
                    onChange={() => toggleSelectRow(account.id)}
                  />
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <span className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeClassName(account.type)}`}>
                    <span className="mr-1">{getTypeIcon(account.type)}</span>
                    {getTypeLabel(account.type)}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{account.accountEmail}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  Rp {account.price.toLocaleString('id-ID')}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{account.warranty} hari</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(account.isActive)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{formatDate(account.createdAt)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <Link 
                    href={`/admin/accounts/${account.id}`}
                    className="text-gray-500 hover:text-indigo-600"
                  >
                    <FiEye className="h-4 w-4" />
                  </Link>
                  <Link 
                    href={`/admin/accounts/${account.id}/edit`}
                    className="text-gray-500 hover:text-indigo-600"
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </Link>
                  <button 
                    className="text-gray-500 hover:text-red-600"
                    onClick={() => {
                      if (window.confirm('Apakah Anda yakin ingin menghapus akun ini?')) {
                        // Logika hapus akun
                      }
                    }}
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AccountsTable; 