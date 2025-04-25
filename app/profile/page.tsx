'use client';

import { useState, useEffect, useRef } from 'react';
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
  
  FiUpload,
  FiCamera
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Helper function untuk menentukan apakah sebuah URL adalah data URL
  const isDataUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    return url.startsWith('data:');
  };

  // Fungsi untuk resize gambar sebelum upload
  const resizeImage = (file: File, maxWidth: number = 300, maxHeight: number = 300): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Buat elemen image dan canvas untuk resizing
      const img = new window.Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Tidak dapat membuat context canvas'));
        return;
      }
      
      // Set up image onload handler
      img.onload = () => {
        // Hitung rasio aspek untuk menjaga proporsi
        let width = img.width;
        let height = img.height;
        
        // Untuk gambar profil, sebaiknya gunakan bentuk persegi
        const minDimension = Math.min(width, height);
        const aspectRatio = 1; // 1:1 untuk foto profil
        
        // Memastikan gambar berbentuk persegi
        width = minDimension;
        height = minDimension;
        
        // Skala ke ukuran yang lebih kecil
        if (width > maxWidth) {
          width = maxWidth;
          height = maxWidth;
        }
        
        // Set canvas size dan gambar yang di-resize
        canvas.width = width;
        canvas.height = height;
        
        // Bersihkan canvas sebelum menggambar
        ctx.clearRect(0, 0, width, height);
        
        // Jika gambar asli tidak persegi, potong bagian tengahnya
        if (img.width !== img.height) {
          const sourceSize = Math.min(img.width, img.height);
          const sourceX = (img.width - sourceSize) / 2;
          const sourceY = (img.height - sourceSize) / 2;
          
          // Gambar dengan cropping untuk memastikan bentuk persegi
          ctx.drawImage(
            img,
            sourceX, sourceY, sourceSize, sourceSize,
            0, 0, width, height
          );
        } else {
          // Gambar biasa jika sudah persegi
          ctx.drawImage(img, 0, 0, width, height);
        }
        
        // Convert ke base64 dengan kualitas yang dikurangi
        // Menggunakan JPEG untuk ukuran file yang lebih kecil
        let quality = 0.7; // 70% kualitas, mengurangi ukuran file secara signifikan
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Jika ukuran masih terlalu besar, kurangi lagi kualitasnya
        if (dataUrl.length > 500000) { // Jika lebih dari ~500KB
          quality = 0.5;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        
        resolve(dataUrl);
      };
      
      // Handler error
      img.onerror = (err: Event | string) => {
        reject(new Error('Gagal memuat gambar untuk diproses'));
      };
      
      // Load gambar dari file
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          img.src = e.target.result;
        } else {
          reject(new Error('Gagal membaca file gambar'));
        }
      };
      reader.onerror = () => {
        reject(new Error('Terjadi kesalahan saat membaca file'));
      };
      reader.readAsDataURL(file);
    });
  };

  // Fungsi alternatif untuk resize gambar (fallback)
  const resizeImageFallback = (file: File, maxWidth: number = 300, maxHeight: number = 300): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Tidak dapat membuat context canvas'));
            return;
          }
          
          // Hitung dimensi yang diinginkan
          let width = img.width;
          let height = img.height;
          
          // Untuk gambar profil, bentuk persegi ideal
          const minDimension = Math.min(width, height);
          width = minDimension;
          height = minDimension;
          
          if (width > maxWidth) {
            width = maxWidth;
            height = maxWidth;
          }
          
          // Set dimensi canvas
          canvas.width = width;
          canvas.height = height;
          
          // Jika gambar asli tidak persegi, potong bagian tengahnya
          if (img.width !== img.height) {
            const sourceSize = Math.min(img.width, img.height);
            const sourceX = (img.width - sourceSize) / 2;
            const sourceY = (img.height - sourceSize) / 2;
            
            ctx.drawImage(
              img,
              sourceX, sourceY, sourceSize, sourceSize,
              0, 0, width, height
            );
          } else {
            ctx.drawImage(img, 0, 0, width, height);
          }
          
          // Konversi ke base64 dengan kualitas lebih rendah
          let quality = 0.7;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          
          if (dataUrl.length > 500000) {
            quality = 0.5;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          
          resolve(dataUrl);
        };
        
        img.onerror = () => {
          reject(new Error('Gagal memuat gambar untuk diproses'));
        };
        
        img.src = event.target?.result as string;
      };
      
      reader.onerror = () => {
        reject(new Error('Gagal membaca file gambar'));
      };
      
      reader.readAsDataURL(file);
    });
  };

  // Fetch fresh profile image from API
  useEffect(() => {
    const fetchProfileImage = async () => {
      if (session?.user) {
        try {
          // Tambahkan timestamp untuk mencegah cache
          const timestamp = Date.now();
          const response = await fetch(`/api/profileImage?t=${timestamp}`);
          if (response.ok) {
            const data = await response.json();
            setProfileImageUrl(data.imageUrl);
          }
        } catch (error) {
          console.error('Error fetching profile image:', error);
        }
      }
    };

    fetchProfileImage();
    
    // Tambahkan interval untuk memperbarui gambar profil setiap 5 detik
    const intervalId = setInterval(fetchProfileImage, 5000);
    
    // Cleanup interval saat komponen unmount
    return () => clearInterval(intervalId);
  }, [session]);

  // Inisialisasi data formulir dengan data pengguna
  useEffect(() => {
    if (session?.user) {
      setFormData(prevData => ({
        ...prevData,
        name: session.user.name || '',
      }));
      if (session.user.image) {
        setImagePreview(session.user.image);
      }
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Verify file is an image
    if (!file.type.startsWith('image/')) {
      setSubmitMessage({
        type: 'error',
        text: 'File harus berupa gambar (JPG, PNG, atau GIF)'
      });
      return;
    }
    
    // Verify file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setSubmitMessage({
        type: 'error',
        text: 'Ukuran file tidak boleh lebih dari 2MB'
      });
      return;
    }
    
    setImageFile(file);
    
    // Coba resize dengan metode utama
    resizeImage(file, 300, 300)
      .then((resizedImage) => {
        setImagePreview(resizedImage);
      })
      .catch((error) => {
        console.error('Error pada metode resize utama, mencoba metode alternatif:', error);
        
        // Coba dengan metode alternatif jika metode utama gagal
        resizeImageFallback(file, 300, 300)
          .then((resizedImage) => {
            setImagePreview(resizedImage);
          })
          .catch((fallbackError) => {
            console.error('Error pada metode resize alternatif:', fallbackError);
            
            // Fallback ke metode sederhana tanpa resize jika semua gagal
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const result = reader.result as string;
                if (typeof result === 'string' && result.startsWith('data:image/')) {
                  setImagePreview(result);
                } else {
                  throw new Error('Format gambar tidak valid');
                }
              } catch (error) {
                console.error('Error processing image:', error);
                setSubmitMessage({
                  type: 'error',
                  text: 'Terjadi kesalahan saat memproses gambar'
                });
              }
            };
            reader.onerror = () => {
              setSubmitMessage({
                type: 'error',
                text: 'Terjadi kesalahan saat membaca file'
              });
            };
            reader.readAsDataURL(file);
          });
      });
  };

  const handleImageUpload = async () => {
    if (!imageFile || !imagePreview) return;
    
    setIsUploadingImage(true);
    setSubmitMessage(null);
    
    try {
      let finalImageToUpload = imagePreview;
      
      // Pastikan ukuran string base64 tidak terlalu besar
      if (imagePreview.length > 800000) { // Lebih dari ~800KB
        try {
          // Coba resize lagi dengan ukuran lebih kecil menggunakan metode alternatif
          const resizedAgain = await resizeImageFallback(imageFile, 200, 200);
          finalImageToUpload = resizedAgain;
          console.log('Gambar berhasil di-resize ulang');
        } catch (resizeError) {
          console.warn('Gagal resize ulang, mencoba dengan gambar asli:', resizeError);
          // Jika masih terlalu besar, berikan peringatan
          if (imagePreview.length > 1500000) { // > 1.5MB
            throw new Error('Ukuran gambar terlalu besar, silakan pilih gambar yang lebih kecil');
          }
        }
      }
      
      console.log('Ukuran gambar yang dikirim (bytes):', finalImageToUpload.length);
      
      // Gunakan endpoint API baru untuk upload foto
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: finalImageToUpload }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server response:', errorData);
        throw new Error(errorData.message || 'Terjadi kesalahan saat memperbarui foto profil');
      }
      
      const data = await response.json();
      
      // Update session with new image
      await update({ image: finalImageToUpload });
      
      // Perbarui URL gambar profil
      setProfileImageUrl(finalImageToUpload);
      
      // Refresh halaman untuk memastikan perubahan terlihat
      router.refresh();
      
      setSubmitMessage({
        type: 'success',
        text: 'Foto profil berhasil diperbarui',
      });
      
      // Reset upload state
      setImageFile(null);
      
      // If fileInputRef is defined, reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setSubmitMessage({
        type: 'error',
        text: error instanceof Error 
          ? error.message 
          : 'Terjadi kesalahan saat mengupload foto profil',
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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
          <div className="relative h-16 w-16 group">
            <Image
              src={
                imagePreview ? imagePreview :
                profileImageUrl?.startsWith('data:') ? profileImageUrl :
                profileImageUrl ? `${profileImageUrl}?t=${Date.now()}` :
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
              unoptimized={
                isDataUrl(imagePreview) || 
                isDataUrl(profileImageUrl) || 
                isDataUrl(session?.user?.image)
              }
              referrerPolicy="no-referrer"
              key={`profile-sidebar-img-${Date.now()}`}
            />
            <div 
              className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all cursor-pointer"
              onClick={triggerFileInput}
            >
              <FiCamera className="text-white opacity-0 group-hover:opacity-100 h-6 w-6" />
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{session?.user?.name}</h3>
            <p className="text-xs text-gray-500">{session?.user?.email}</p>
            <button 
              onClick={triggerFileInput}
              className="mt-1 text-xs text-primary hover:text-primary-dark flex items-center"
            >
              <FiEdit className="h-3 w-3 mr-1" /> Ganti foto
            </button>
            <input 
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
            />
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
            {imageFile && imagePreview && imagePreview !== session?.user?.image && (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative h-16 w-16">
                        <Image
                          src={imagePreview || ''}
                          alt="Preview"
                          className="rounded-full object-cover"
                          fill
                          sizes="64px"
                          priority
                          style={{ objectFit: 'cover' }}
                          unoptimized={isDataUrl(imagePreview)}
                          referrerPolicy="no-referrer"
                          key={`preview-img-${Date.now()}`}
                        />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Pratinjau Foto Profil</h3>
                        <p className="text-sm text-gray-500">Klik tombol simpan untuk mengatur foto baru.</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setImageFile(null)}
                        disabled={isUploadingImage}
                      >
                        Batal
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleImageUpload}
                        isLoading={isUploadingImage}
                        disabled={isUploadingImage}
                      >
                        <FiUpload className="mr-1 h-4 w-4" /> Simpan Foto
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
        
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
        </Card>
            
            {/* Aktivitas Terbaru */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Aktivitas Terbaru</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <FiUser className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Perubahan profil</p>
                      <p className="text-xs text-gray-500">Anda mengubah nama profil Anda</p>
                    </div>
                    <span className="text-xs text-gray-500">2 hari yang lalu</span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                      <FiShoppingBag className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Pembelian berhasil</p>
                      <p className="text-xs text-gray-500">Anda membeli Netflix Premium 1 Bulan</p>
                    </div>
                    <span className="text-xs text-gray-500">1 minggu yang lalu</span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                      <FiLock className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Login baru</p>
                      <p className="text-xs text-gray-500">Login baru terdeteksi dari Jakarta</p>
                    </div>
                    <span className="text-xs text-gray-500">2 minggu yang lalu</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 