'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FiPlay, FiMusic, FiClock, FiInfo, FiAlertCircle, FiCheckCircle, FiUser, FiShield } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import RequestProfileButton from './RequestProfileButton';
import RefreshProfileButton from './RefreshProfileButton';
import SpotifySlotsDisplay from './SpotifySlotsDisplay';

// Tipe untuk akun
type AccountType = 'NETFLIX' | 'SPOTIFY';

interface AccountDetail {
  id: string;
  type: AccountType;
  accountEmail: string;
  accountPassword: string;
  price: number;
  description: string;
  warranty: number;
  isActive: boolean;
  createdAt: string;
  stock?: number;
  duration?: number;
  profiles?: Array<{
    id: string;
    name: string;
    pin?: string;
    isKids: boolean;
    userId?: string;
    orderId?: string;
  }>;
  orderItems: Array<{
    id: string;
    orderId: string;
    accountId: string;
    netflixProfile?: {
      id: string;
      name: string;
      pin?: string;
      isKids: boolean;
      userId?: string;
      orderId?: string;
      account?: {
        id: string;
        type: string;
      };
    };
    order: {
      id: string;
      customerName: string;
      userId: string;
      status: string;
    };
  }>;
}

export default function AccountDetailPage() {
  // Gunakan useParams hook untuk mengakses parameter
  const params = useParams();
  const accountId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  
  const router = useRouter();
  const { data: session } = useSession();
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportIssue, setReportIssue] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Cek apakah user adalah admin
  const isAdmin = session?.user?.role === 'ADMIN';
  
  useEffect(() => {
    if (!session) {
      router.push('/auth/login');
      return;
    }

    if (!accountId) {
      setError('ID akun tidak valid');
      setIsLoading(false);
      return;
    }

    const fetchAccountDetail = async () => {
      try {
        setIsLoading(true);
        
        // Gunakan headers yang tepat untuk permintaan JSON
        const response = await fetch(`/api/accounts/${accountId}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: 'include' // Pastikan kredensial (cookie) dikirim
        });
        
        // Verifikasi jenis konten respons
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Respons server bukan dalam format JSON yang valid');
        }
        
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/auth/login');
            throw new Error('Sesi login Anda telah berakhir. Silakan login kembali.');
          } else if (response.status === 403) {
            throw new Error('Anda tidak memiliki izin untuk melihat akun ini');
          } else if (response.status === 404) {
            throw new Error('Akun tidak ditemukan');
          } else {
            throw new Error('Gagal mengambil detail akun');
          }
        }
        
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          
          // Log untuk debugging data akun
          console.log('===== FRONTEND DEBUG ACCOUNT DATA =====');
          console.log(`Account ID: ${data.id}, Type: ${data.type}`);
          console.log(`Total OrderItems: ${data.orderItems ? data.orderItems.length : 0}`);
          
          // Periksa orderItems dan netflixProfile
          if (data.orderItems && data.orderItems.length > 0) {
            console.log(`OrderItems dengan NetflixProfile: ${data.orderItems.filter((item: any) => item.netflixProfile).length}`);
            
            // Log detail setiap orderItem
            data.orderItems.forEach((item: any, index: number) => {
              console.log(`OrderItem ${index + 1} (ID: ${item.id.substring(0, 8)}...)`);
              if (item.netflixProfile) {
                console.log(`  - NetflixProfile: ADA`);
                console.log(`  - Nama: ${item.netflixProfile.name}`);
                console.log(`  - ID: ${item.netflixProfile.id.substring(0, 8)}...`);
              } else {
                console.log(`  - NetflixProfile: TIDAK ADA`);
              }
            });
          } else {
            console.log('Tidak ada orderItems pada akun ini');
          }
          
          // Periksa profiles langsung
          if (data.profiles && data.profiles.length > 0) {
            console.log(`Total Profiles Langsung: ${data.profiles.length}`);
            data.profiles.forEach((profile: any, index: number) => {
              console.log(`Profile ${index + 1}: ${profile.name} (ID: ${profile.id.substring(0, 8)}...)`);
            });
          } else {
            console.log('Tidak ada profiles langsung pada akun ini');
          }
          console.log('======================================');
          
          setAccount(data);
        } catch (e) {
          console.error('Gagal parsing JSON:', text);
          throw new Error('Respons server tidak valid');
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat detail akun');
        console.error('Error fetching account detail:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccountDetail();
  }, [accountId, router, session]);

  const handleReportIssue = async () => {
    if (!issueDescription.trim()) {
      toast.error('Mohon isi deskripsi masalah terlebih dahulu');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/support/report', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          accountId: accountId,
          description: issueDescription,
        }),
      });

      // Verifikasi jenis konten respons
      const contentType = response.headers.get('content-type');
      
      if (response.ok) {
        toast.success('Laporan masalah berhasil dikirim. Tim kami akan segera menghubungi Anda.');
        setReportIssue(false);
        setIssueDescription('');
      } else if (response.status === 401) {
        router.push('/auth/login');
        toast.error('Sesi login Anda telah berakhir. Silakan login kembali.');
      } else {
        // Coba dapatkan pesan error dari respons
        let errorMessage = 'Gagal mengirim laporan. Silakan coba lagi.';
        if (contentType && contentType.includes('application/json')) {
          try {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          } catch (e) {
            console.error('Gagal parsing JSON error:', e);
          }
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('Terjadi kesalahan. Silakan coba lagi nanti.');
      console.error('Error submitting report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeLabel = (type: AccountType) => {
    switch (type) {
      case 'NETFLIX':
        return 'Netflix Premium';
      case 'SPOTIFY':
        return 'Spotify Premium';
      default:
        return '';
    }
  };

  const getIcon = (type: AccountType) => {
    switch (type) {
      case 'NETFLIX':
        return <FiPlay className="h-6 w-6 text-red-600" />;
      case 'SPOTIFY':
        return <FiMusic className="h-6 w-6 text-green-600" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: AccountType) => {
    switch (type) {
      case 'NETFLIX':
        return 'text-red-600 bg-red-100';
      case 'SPOTIFY':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateWarrantyEnd = (startDate: string, warrantyDays: number) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + warrantyDays);
    return formatDate(date.toISOString());
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <FiAlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">
            {error || 'Akun tidak ditemukan'}
          </h2>
          <p className="text-gray-500 mb-6">
            Terjadi kesalahan saat memuat detail akun. Silakan coba lagi nanti.
          </p>
          <Button 
            variant="primary"
            onClick={() => router.push('/account')}
          >
            Kembali ke Daftar Akun
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className={`w-full h-2 ${account.type === 'NETFLIX' ? 'bg-red-600' : 'bg-green-600'}`}></div>
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="mr-3">{getIcon(account.type)}</div>
              <div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(account.type)}`}>
                  {getTypeLabel(account.type)}
                </span>
                <h1 className="text-2xl font-bold text-gray-900 mt-1">
                  {getTypeLabel(account.type)} Sharing
                </h1>
              </div>
            </div>
            <div>
              <Button 
                variant="outline"
                onClick={() => setReportIssue(!reportIssue)}
                className="text-sm"
              >
                <FiAlertCircle className="mr-1" />
                Laporkan Masalah
              </Button>
            </div>
          </div>
          
          {reportIssue && (
            <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
              <h3 className="text-md font-medium text-gray-900 mb-3">
                Laporkan Masalah dengan Akun Ini
              </h3>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={4}
                placeholder="Deskripsikan masalah yang Anda alami dengan akun ini..."
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
              ></textarea>
              <div className="mt-3 flex justify-end space-x-3">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setReportIssue(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button 
                  variant="primary"
                  size="sm"
                  onClick={handleReportIssue}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
                </Button>
              </div>
            </div>
          )}
          
          <div className="bg-gray-50 p-5 rounded-lg mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Detail Akun
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hanya tampilkan kredensial akun jika bukan Spotify atau user adalah admin */}
              {(account.type !== 'SPOTIFY' || isAdmin) && (
                <div>
                  <div className="flex items-center mb-3">
                    <FiUser className="h-5 w-5 text-gray-500 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{account.accountEmail}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center mb-3">
                    <FiShield className="h-5 w-5 text-gray-500 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Password</p>
                      <p className="font-medium">{account.accountPassword}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Jika ini Spotify dan bukan admin, tambahkan pesan informasi */}
              {account.type === 'SPOTIFY' && !isAdmin && (
                <div>
                  <div className="flex items-center mb-3">
                    <FiInfo className="h-5 w-5 text-blue-500 mr-2" />
                    <div>
                      <p className="text-sm text-gray-700">
                        Informasi kredensial untuk slot Spotify Anda tersedia di bagian <strong>"Detail Slot Spotify"</strong> di bawah.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <div className="flex items-center mb-3">
                  <FiClock className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Tanggal Aktivasi</p>
                    <p className="font-medium">{formatDate(account.createdAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-center mb-3">
                  <FiShield className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Garansi Berakhir</p>
                    <p className="font-medium">{calculateWarrantyEnd(account.createdAt, account.warranty)}</p>
                  </div>
                </div>
                
                {account.duration && (
                  <div className="flex items-center mb-3">
                    <FiClock className="h-5 w-5 text-gray-500 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Masa Berlaku</p>
                      <p className="font-medium">{account.duration} Bulan</p>
                    </div>
                  </div>
                )}
                
                {account.stock !== undefined && isAdmin && (
                  <div className="flex items-center mb-3">
                    <FiShield className="h-5 w-5 text-gray-500 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Stok Tersedia</p>
                      <p className="font-medium">{account.stock}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-3">
              Deskripsi Akun
            </h2>
            <p className="text-gray-600">
              {account.description}
            </p>
          </div>
          
          {/* Tampilkan pesan jika tidak ada profil yang dialokasikan */}
          {account.type === 'NETFLIX' && (!account.profiles || account.profiles.length === 0) && (!account.orderItems || account.orderItems.filter(item => item.netflixProfile && item.netflixProfile.userId === session?.user?.id).length === 0) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center text-gray-700">
                <FiInfo className="h-5 w-5 mr-2 text-blue-500" />
                <p>
                  Belum ada profil Netflix yang dialokasikan untuk Anda. Silakan hubungi admin jika Anda membutuhkan bantuan.
                </p>
              </div>
            </div>
          )}
          
          {/* Auto-allocate Netflix profiles if needed - using client script */}
          {account.type === 'NETFLIX' && account.orderItems && 
           account.orderItems.length > 0 && 
           account.orderItems.filter(item => item.netflixProfile).length === 0 && (
             <div className="hidden">
               <script 
                 dangerouslySetInnerHTML={{
                   __html: `
                     // Auto-allocate profile on page load
                     setTimeout(() => {
                       fetch('/api/netflix/allocate', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({ 
                           orderItemId: '${account.orderItems[0].id}' 
                         })
                       })
                       .then(res => res.json())
                       .then(data => {
                         if (data.success) {
                           window.location.reload();
                         }
                       })
                       .catch(err => console.error('Error auto-allocating profile:', err));
                     }, 500);
                   `
                 }} 
               />
             </div>
          )}
          
          {/* Tampilkan Detail Pesanan dengan Profil Netflix Terkait */}
          {account.type === 'NETFLIX' && account.orderItems && account.orderItems.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <FiPlay className="mr-2 text-red-600" />
                  Profil Netflix Anda
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded-full">
                    Eksklusif
                  </span>
                </h2>
                <RefreshProfileButton accountId={account.id} />
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 mb-4">
                <p className="text-sm text-yellow-700 flex items-center">
                  <FiInfo className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>
                    <strong>Profil Netflix ini dialokasikan khusus untuk Anda.</strong> Gunakan profil ini saat login ke Netflix.
                  </span>
                </p>
              </div>
              
              {/* Menampilkan hanya profil Netflix yang dimiliki user saat ini */}
              <div className="space-y-4">
                {account.orderItems
                  .filter(item => item.netflixProfile && item.netflixProfile.userId === session?.user?.id)
                  .map((item) => (
                  <div key={item.id} className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-md flex items-center justify-center text-white font-bold mr-4 ${
                        item.netflixProfile?.isKids ? 'bg-green-500' : 'bg-red-600'
                      }`}>
                        {item.netflixProfile?.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">{item.netflixProfile?.name}</h3>
                        <div className="flex items-center text-sm mt-1">
                          <span className={`mr-2 px-2 py-0.5 rounded-full ${
                            item.netflixProfile?.isKids 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {item.netflixProfile?.isKids ? 'Profil Anak' : 'Profil Dewasa'}
                          </span>
                          {item.netflixProfile?.pin && (
                            <span className="bg-white px-2 py-0.5 rounded-full border border-gray-200">
                              PIN: <span className="font-mono">{item.netflixProfile.pin}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-white rounded-lg border border-red-100">
                      <p className="text-sm text-gray-700">
                        Login ke Netflix menggunakan email dan password yang tertera di atas, kemudian pilih profil "{item.netflixProfile?.name}".
                      </p>
                    </div>
                  </div>
                ))}
                
                {account.orderItems.filter(item => item.netflixProfile && item.netflixProfile.userId === session?.user?.id).length === 0 && (
                  <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                    <div className="flex items-start">
                      <FiAlertCircle className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="text-md font-medium text-orange-800 mb-1">
                          Belum ada profil Netflix yang dialokasikan untuk Anda
                        </h3>
                        <p className="text-sm text-orange-700 mb-4">
                          Anda belum memiliki profil Netflix yang dialokasikan. Silakan hubungi admin atau coba alokasikan profil secara manual.
                        </p>
                        <RequestProfileButton 
                          accountId={account.id} 
                          orderItems={account.orderItems.filter(item => !item.netflixProfile)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600">
                  <strong>Penting:</strong> Akun Netflix Premium dapat digunakan hingga 4 perangkat secara bersamaan. 
                  Profil ini eksklusif untuk Anda dan tidak bisa diakses pengguna lain. Jangan berbagi kredensial profil Anda dengan orang lain.
                </p>
              </div>
            </div>
          )}
          
          {/* Tampilkan Detail Spotify Slots */}
          {account.type === 'SPOTIFY' && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <FiMusic className="mr-2 text-green-600" />
                  Detail Slot Spotify
                </h2>
              </div>
              
              <div className="bg-green-50 p-3 rounded-md border border-green-200 mb-4">
                <p className="text-sm text-green-700 flex items-center">
                  <FiInfo className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>
                    <strong>Informasi tentang slot Spotify Anda.</strong> Setiap slot memungkinkan Anda untuk menambahkan 1 perangkat ke akun family plan.
                  </span>
                </p>
              </div>

              {/* Fetch and display Spotify slots */}
              <div className="mt-6">
                <SpotifySlotsDisplay accountId={account.id} />
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600">
                  <strong>Penting:</strong> Slot Spotify hanya dapat digunakan untuk 1 perangkat sekaligus.
                  Jangan berbagi kredensial slot Anda dengan orang lain.
                </p>
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 p-4 rounded-lg mb-6 flex items-start">
            <FiInfo className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-md font-medium text-blue-800">
                Informasi Penting
              </h3>
              <ul className="mt-2 text-blue-700 text-sm space-y-1">
                {account.type === 'NETFLIX' ? (
                  <>
                    <li>• Jangan mengubah password atau informasi profil akun</li>
                    <li>• Jangan mengganti bahasa atau pengaturan pribadi lainnya</li>
                    <li>• Akun dapat digunakan pada 1 perangkat saja dalam waktu bersamaan</li>
                  </>
                ) : (
                  <>
                    <li>• Gunakan kredensial slot Spotify yang diberikan untuk login</li>
                    <li>• Jangan mengubah pengaturan akun seperti password atau alamat email</li>
                    <li>• Jangan menghapus anggota lain dari akun Family Plan</li>
                  </>
                )}
                <li>• Masa garansi berlaku {account.warranty} hari sejak tanggal aktivasi</li>
                <li>• Hubungi kami segera jika mengalami masalah dengan akun</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center text-center p-5 border border-green-200 rounded-lg bg-green-50">
            <FiCheckCircle className="h-8 w-8 text-green-600 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Akun Aktif dan Siap Digunakan
            </h3>
            <p className="text-gray-600 mb-3">
              Selamat menikmati layanan {getTypeLabel(account.type)} premium!
            </p>
            <div className="flex space-x-3">
              <Button 
                variant="primary"
                onClick={() => {
                  if (account.type === 'NETFLIX') {
                    window.open('https://www.netflix.com/login', '_blank');
                  } else if (account.type === 'SPOTIFY') {
                    window.open('https://accounts.spotify.com/login', '_blank');
                  }
                }}
              >
                Login ke {getTypeLabel(account.type)}
              </Button>
            </div>
          </div>

          {/* Bagian informasi penting digabungkan ke sini */}
          {account && account.type === 'NETFLIX' && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6 mt-6">
              <div className="border-l-4 border-red-500 p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <FiInfo className="h-5 w-5 text-red-500" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-base font-medium text-red-600">Informasi Penting</h3>
                    <div className="mt-2 text-sm text-gray-700">
                      <p>Anda hanya memiliki akses ke <strong>profil Netflix</strong> yang ditampilkan di atas. Jangan mengubah profil lain atau mengubah pengaturan akun utama.</p>
                      <ul className="list-disc list-inside mt-2">
                        <li>Gunakan profil yang telah dialokasikan untuk Anda</li>
                        <li>Jangan mengubah password akun utama</li>
                        <li>Jangan mengubah pengaturan profil lain</li>
                        <li>Jangan menambah atau menghapus profil</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Tambahkan informasi khusus untuk Spotify Family Plan */}
          {account && account.type === 'SPOTIFY' && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6 mt-6">
              <div className="border-l-4 border-green-500 p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <FiInfo className="h-5 w-5 text-green-500" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-base font-medium text-green-600">Informasi Penting Spotify Family</h3>
                    <div className="mt-2 text-sm text-gray-700">
                      <p>Anda hanya memiliki akses ke <strong>slot Spotify</strong> yang ditampilkan di atas. Berikut panduan penggunaan:</p>
                      <ul className="list-disc list-inside mt-2">
                        <li>Gunakan kredensial slot yang ditampilkan di bagian Detail Slot</li>
                        <li>Jangan mengubah pengaturan akun utama</li>
                        <li>Jangan menghapus atau mengubah anggota lain di family plan</li>
                        <li>Spotify dapat digunakan pada satu perangkat pada satu waktu</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 