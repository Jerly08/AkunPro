'use client';

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { FiEdit2, FiTrash2, FiEye, FiClock, FiDollarSign, FiShield, FiUser, FiAlertCircle, FiCheckCircle, FiEdit, FiPlus, FiTrash } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import AdminHeader from '@/components/admin/AdminHeader';
import prisma from '@/lib/prisma';
import AdminLayout from '@/components/layout/AdminLayout';
import ProfileList from '../components/ProfileList';
import AccountForm from '../components/AccountForm';
import SpotifyFamilyForm from '../components/SpotifyFamilyForm';

interface AccountDetailPageProps {
  params: {
    id: string;
  };
}

// Helper function for fetching data
async function getAccountById(id: string) {
  try {
    const account = await prisma.account.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            name: true,
            email: true,
          },
        },
        profiles: true,
      },
    });
    
    return account;
  } catch (error) {
    console.error('Error fetching account:', error);
    return null;
  }
}

// Client component to handle client-side functionality
function AccountDetailClient({ account }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const updateAccount = async (data: FormData) => {
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: 'PUT',
        body: data
      });
      
      if (!response.ok) {
        throw new Error('Gagal memperbarui akun');
      }
      
      // Simpan timestamp terakhir update di localStorage
      // untuk memberitahu halaman client bahwa ada perubahan data
      localStorage.setItem('adminDataUpdated', Date.now().toString());
      
      // Tambahkan flag khusus jika terjadi perubahan status isActive
      const currentIsActive = account.isActive;
      const newIsActive = data.get('isActive') === 'on';
      
      if (currentIsActive !== newIsActive) {
        console.log('Status akun berubah. Memberitahu client untuk refresh data.');
        localStorage.setItem('adminAccountStatusChanged', Date.now().toString());
      }
      
      toast.success('Akun berhasil diperbarui!');
      router.refresh();
    } catch (error) {
      console.error('Error updating account:', error);
      toast.error('Gagal memperbarui akun');
    } finally {
      setIsSaving(false);
    }
  };

  const isNetflixAccount = account.type === 'NETFLIX';
  const isSpotifyAccount = account.type === 'SPOTIFY';

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-screen-2xl mx-auto">
        <div className="mb-8 sm:flex sm:justify-between sm:items-center">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl md:text-3xl font-bold">Detail Akun</h1>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg mb-8">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-xl text-gray-800">Informasi Akun</h2>
              <div>
                <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                  account.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {account.isActive ? 'Aktif' : 'Tidak Aktif'}
                </span>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Tipe Akun</h3>
                <p className="text-base font-medium">{account.type}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                <p className="text-base font-medium break-all">{account.accountEmail}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Password</h3>
                <p className="text-base font-medium">{account.accountPassword}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Harga</h3>
                <p className="text-base font-medium">Rp {account.price.toLocaleString('id-ID')}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Durasi</h3>
                <p className="text-base font-medium">{account.duration} bulan</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Garansi</h3>
                <p className="text-base font-medium">{account.warranty} hari</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Stok</h3>
                <p className="text-base font-medium">{account.stock}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Status Booking</h3>
                <div className="flex items-center">
                  {account.isBooked ? (
                    <>
                      <FiClock className="text-amber-500 mr-1" />
                      <span className="text-amber-500 font-medium">Sedang Dibooking</span>
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="text-green-500 mr-1" />
                      <span className="text-green-500 font-medium">Tersedia</span>
                    </>
                  )}
                </div>
              </div>
              {isSpotifyAccount && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Family Plan</h3>
                  <div className="flex items-center">
                    {account.isFamilyPlan ? (
                      <>
                        <FiCheckCircle className="text-green-500 mr-1" />
                        <span className="text-green-500 font-medium">Ya ({account.maxSlots || 1} slot)</span>
                      </>
                    ) : (
                      <>
                        <FiAlertCircle className="text-gray-500 mr-1" />
                        <span className="text-gray-500 font-medium">Tidak</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Deskripsi</h3>
              <p className="text-sm text-gray-700 whitespace-pre-line">{account.description}</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button 
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
              >
                <FiEdit className="mr-1.5" />
                Edit Akun
              </button>
              <DeleteAccountButton 
                accountId={account.id} 
                accountEmail={account.accountEmail} 
              />
            </div>
          </div>
        </div>

        {isNetflixAccount && (
          <div className="bg-white shadow-sm rounded-lg mb-8">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-xl text-gray-800">Profil Netflix</h2>
                <button 
                  className="inline-flex items-center px-3 py-1.5 text-sm rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                >
                  <FiPlus className="mr-1" /> Tambah Profil
                </button>
              </div>
            </div>
            <div className="p-6">
              <ProfileList profiles={account.profiles} />
            </div>
          </div>
        )}

        {isSpotifyAccount && account.isFamilyPlan && (
          <div className="mb-8">
            <SpotifyFamilyForm 
              accountId={account.id} 
              isFamilyPlan={Boolean(account.isFamilyPlan)} 
              maxSlots={account.maxSlots || 1} 
            />
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="font-semibold text-xl text-gray-800">Edit Akun</h2>
          </div>
          <div className="p-6">
            <AccountForm account={account} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// Server component wrapper for data fetching
export default async function AccountDetailPage({ params }: AccountDetailPageProps) {
  const id = params.id;
  
  const session = await getServerSession();
  
  if (!session || session.user?.role !== 'ADMIN') {
    redirect('/auth/login');
  }
  
  const account = await getAccountById(id);
  
  if (!account) {
    return notFound();
  }

  // Pass data to client component
  return <AccountDetailClient account={account} />;
}

// Delete account button component 
function DeleteAccountButton({ accountId, accountEmail }: { accountId: string, accountEmail: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    // Konfirmasi penghapusan dengan alert yang lebih informatif
    const isConfirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus akun ${accountEmail}?\n\nAkun ini akan dihapus permanen dari sistem dan tidak dapat dikembalikan.`
    );
    
    if (!isConfirmed) return;
    
    setIsDeleting(true);
    
    // Tampilkan toast loading
    const loadingToast = toast.loading('Sedang menghapus akun...');
    
    try {
      const response = await fetch(`/api/admin/accounts/${accountId}`, {
        method: 'DELETE',
      });
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Terjadi kesalahan saat menghapus akun');
      }
      
      // Simpan timestamp untuk sinkronisasi dengan client
      localStorage.setItem('adminDataUpdated', Date.now().toString());
      
      // Tampilkan toast sukses
      toast.success(`Akun ${accountEmail} berhasil dihapus`, {
        duration: 4000,
        icon: '🗑️',
        style: {
          border: '1px solid #22c55e',
          padding: '16px',
          color: '#166534',
          background: '#f0fdf4',
        },
      });
      
      // Redirect ke halaman daftar akun
      router.push('/admin/accounts');
      router.refresh();
    } catch (error) {
      console.error('Error deleting account:', error);
      
      // Tampilkan toast error
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus akun', {
        duration: 5000,
        icon: '❌',
        style: {
          border: '1px solid #ef4444',
          padding: '16px',
          color: '#b91c1c',
          background: '#fef2f2',
        },
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-50"
    >
      <FiTrash2 className="mr-1.5" />
      {isDeleting ? 'Menghapus...' : 'Hapus Akun'}
    </button>
  );
} 