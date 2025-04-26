'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  FiUser, 
  FiEdit, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiEye, 
  FiEyeOff, 
  FiLock,
  FiHome,
  FiShoppingBag,
  FiCreditCard,
  FiHelpCircle,
  FiMessageCircle
} from 'react-icons/fi';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import AuthGuard from '@/components/auth/AuthGuard';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface ProfileFormData {
  name: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface SubmitMessage {
  type: 'success' | 'error' | 'info';
  text: string;
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<SubmitMessage | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const router = useRouter();

  // Helper function untuk menentukan apakah sebuah URL adalah data URL
  const isDataUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    return url.startsWith('data:');
  };

  // Inisialisasi data formulir dengan data pengguna
  useEffect(() => {
    if (session?.user) {
      setFormData(prevData => ({
        ...prevData,
        name: session.user.name || '',
      }));
    }
  }, [session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setFormData({
      ...formData,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setSubmitMessage(null);
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (formData.name.trim() === '') {
      errors.push('Nama tidak boleh kosong');
    }
    
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        errors.push('Password saat ini harus diisi');
      }
      
      if (formData.newPassword.length < 8) {
        errors.push('Password baru minimal 8 karakter');
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        errors.push('Konfirmasi password tidak sesuai');
      }
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitMessage(null);
    
    // Validasi form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setSubmitMessage({
        type: 'error',
        text: validationErrors.join('. '),
      });
      setIsLoading(false);
      return;
    }
    
    try {
      // Buat objek dengan data yang akan dikirim
      const updateData: {
        name?: string;
        currentPassword?: string;
        newPassword?: string;
      } = {};
      
      // Hanya kirim data yang diubah
      if (formData.name.trim() !== session?.user?.name) {
        updateData.name = formData.name.trim();
      }
      
      // Jika password diubah, kirim currentPassword dan newPassword
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }
      
      // Jika tidak ada data yang diubah, tampilkan pesan
      if (Object.keys(updateData).length === 0) {
        setSubmitMessage({
          type: 'info',
          text: 'Tidak ada perubahan yang dilakukan',
        });
        setIsLoading(false);
        return;
      }
      
      // Kirim data ke API
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update profile');
      }
      
      // Reset form dan tampilkan pesan sukses
      setIsEditing(false);
      setFormData({
        name: formData.name.trim(),
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Refresh session data
      await update({ name: formData.name.trim() });
      
      setSubmitMessage({
        type: 'success',
        text: 'Profil berhasil diperbarui',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      setSubmitMessage({
        type: 'error',
        text: error instanceof Error 
          ? error.message 
          : 'Terjadi kesalahan saat memperbarui profil',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Tampilan sidebar navigasi profil
  const SidebarNav = () => (
    <aside className="w-full md:w-64 md:flex-shrink-0">
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative h-16 w-16">
            <Image
              src={
                session?.user?.image?.startsWith('data:') ? session?.user?.image :
                session?.user?.image ? `${session?.user?.image}?t=${Date.now()}` :
                '/images/avatar-placeholder.svg'
              }
              alt={session?.user?.name || 'User'}
              className="rounded-full object-cover border-2 border-white shadow"
              fill
              sizes="64px"
              priority
              style={{ objectFit: 'cover' }}
              unoptimized={isDataUrl(session?.user?.image)}
              referrerPolicy="no-referrer"
              key={`profile-sidebar-img-${Date.now()}`}
            />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{session?.user?.name}</h3>
            <p className="text-xs text-gray-500">{session?.user?.email}</p>
          </div>
        </div>
        
        <nav className="space-y-1">
          <Link 
            href="/profile"
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              activeTab === 'profile' 
                ? 'bg-primary text-white' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            <FiUser className="mr-3 h-5 w-5" />
            Profil Saya
          </Link>
          
          <Link 
            href="/orders"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
          >
            <FiShoppingBag className="mr-3 h-5 w-5" />
            Pesanan Saya
          </Link>
          
          <Link 
            href="/payments"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
          >
            <FiCreditCard className="mr-3 h-5 w-5" />
            Pembayaran
          </Link>
          
          <Link 
            href="/help"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
          >
            <FiHelpCircle className="mr-3 h-5 w-5" />
            Bantuan
          </Link>
          
          <Link 
            href="/profile/messages"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
          >
            <FiMessageCircle className="mr-3 h-5 w-5" />
            Pesan Saya
          </Link>
        </nav>
      </div>
    </aside>
  );

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Akun Saya</h1>
          <nav className="flex space-x-4">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 flex items-center">
              <FiHome className="mr-1" /> Beranda
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-sm text-gray-700">Akun Saya</span>
          </nav>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          <SidebarNav />
          
          <div className="flex-1">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Informasi Akun</CardTitle>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditToggle}
                      className="flex items-center"
                    >
                      <FiEdit className="mr-1 h-4 w-4" /> Edit Profil
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {submitMessage && (
                  <div className={`mb-4 p-3 rounded-md flex items-center 
                        ${submitMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}
                  >
                        {submitMessage.type === 'success' ? (
                      <FiCheckCircle className="mr-2" />
                    ) : (
                      <FiAlertCircle className="mr-2" />
                    )}
                        <span>{submitMessage.text}</span>
                  </div>
                )}
                
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Nama
                      </label>
                      <div className="mt-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiUser className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleChange}
                          className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Ubah Password</h3>
                      <p className="text-sm text-gray-500 mb-4">Isi form di bawah ini jika ingin mengubah password. Biarkan kosong jika tidak ingin mengubah password.</p>
                      
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                            Password Saat Ini
                          </label>
                          <div className="mt-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FiLock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              id="currentPassword"
                              name="currentPassword"
                              type={showPassword ? 'text' : 'password'}
                              value={formData.currentPassword}
                              onChange={handleChange}
                              className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={togglePasswordVisibility}>
                              {showPassword ? 
                                <FiEyeOff className="h-5 w-5 text-gray-400" /> : 
                                <FiEye className="h-5 w-5 text-gray-400" />
                              }
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                            Password Baru
                          </label>
                          <div className="mt-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FiLock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              id="newPassword"
                              name="newPassword"
                              type={showPassword ? 'text' : 'password'}
                              value={formData.newPassword}
                              onChange={handleChange}
                              className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                            Konfirmasi Password Baru
                          </label>
                          <div className="mt-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FiLock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              id="confirmPassword"
                              name="confirmPassword"
                              type={showPassword ? 'text' : 'password'}
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Informasi Pribadi</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Nama</p>
                          <p className="font-medium">{session?.user?.name}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{session?.user?.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Status Akun</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Peran</p>
                          <p className="font-medium">{session?.user?.role === 'ADMIN' ? 'Administrator' : 'Pengguna'}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Aktif
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {isEditing && (
              <CardFooter className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={handleEditToggle}
                  disabled={isLoading}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  Simpan Perubahan
                </Button>
              </CardFooter>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 