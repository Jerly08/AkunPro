'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { 
  FiUser, 
  FiShoppingBag, 
  FiCreditCard, 
  FiHelpCircle, 
  FiHome,
  FiSettings,
  FiToggleLeft,
  FiToggleRight,
  FiBell,
  FiLock,
  FiGlobe,
  FiSave,
  FiShield
} from 'react-icons/fi';
import Button from '@/components/ui/Button';
import AuthGuard from '@/components/auth/AuthGuard';
import Image from 'next/image';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('privacy');
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      promotions: false,
      orderUpdates: true,
      newsletter: false
    },
    privacy: {
      profileVisibility: 'public',
      shareActivity: false,
      allowDataCollection: true
    },
    preferences: {
      language: 'id',
      darkMode: false,
      autoPlayVideos: true
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch settings when component mounts
  useEffect(() => {
    const fetchSettings = async () => {
      if (!session?.user) return;
      
      try {
        setIsLoading(true);
        const response = await fetch('/api/user/settings');
        
        if (!response.ok) {
          throw new Error('Gagal mengambil pengaturan');
        }
        
        const data = await response.json();
        setSettings(data.settings);
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [session]);

  const handleToggleChange = (section: 'notifications' | 'privacy' | 'preferences', field: string) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: !settings[section][field as keyof typeof settings[typeof section]]
      }
    });
  };

  const handleSelectChange = (section: 'notifications' | 'privacy' | 'preferences', field: string, value: string) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value as any
      }
    });
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Terjadi kesalahan saat menyimpan pengaturan');
      }
      
      setSaveMessage({
        type: 'success',
        text: 'Pengaturan berhasil disimpan'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan pengaturan'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Tampilan sidebar navigasi
  const SidebarNav = () => (
    <aside className="w-full md:w-64 md:flex-shrink-0">
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative h-12 w-12">
            <Image
              src={session?.user?.image || '/images/avatar-placeholder.svg'}
              alt={session?.user?.name || 'User'}
              className="rounded-full object-cover"
              fill
              sizes="48px"
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
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
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
            href="/settings"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-primary text-white"
          >
            <FiSettings className="mr-3 h-5 w-5" />
            Pengaturan
          </Link>
        </nav>
      </div>
    </aside>
  );

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan Akun</h1>
          <nav className="flex space-x-4">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 flex items-center">
              <FiHome className="mr-1" /> Beranda
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-sm text-gray-700">Pengaturan</span>
          </nav>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          <SidebarNav />
          
          <div className="flex-1">
            {/* Tabs untuk pengaturan */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === 'notifications' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <FiBell className="mr-2 h-4 w-4" />
                  Notifikasi
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('privacy')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === 'privacy' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <FiLock className="mr-2 h-4 w-4" />
                  Privasi & Keamanan
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('preferences')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === 'preferences' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <FiGlobe className="mr-2 h-4 w-4" />
                  Preferensi
                </div>
              </button>
            </div>
            
            {saveMessage && (
              <div className={`mb-6 p-4 rounded-md ${
                saveMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {saveMessage.text}
              </div>
            )}
            
            {/* Konten tab untuk notifikasi */}
            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    <div className="flex items-center">
                      <FiBell className="mr-2 h-5 w-5 text-primary" />
                      Pengaturan Notifikasi
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Email Notifikasi</h4>
                        <p className="text-xs text-gray-500">Terima notifikasi penting melalui email</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleChange('notifications', 'email')}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                          settings.notifications.email ? 'bg-primary' : 'bg-gray-200'
                        }`}
                      >
                        <span className="sr-only">Toggle Email Notifications</span>
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                            settings.notifications.email ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Promosi & Diskon</h4>
                        <p className="text-xs text-gray-500">Informasi tentang penawaran dan diskon spesial</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleChange('notifications', 'promotions')}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                          settings.notifications.promotions ? 'bg-primary' : 'bg-gray-200'
                        }`}
                      >
                        <span className="sr-only">Toggle Promotion Notifications</span>
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                            settings.notifications.promotions ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Status Pesanan</h4>
                        <p className="text-xs text-gray-500">Pemberitahuan tentang perubahan status pesanan</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleChange('notifications', 'orderUpdates')}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                          settings.notifications.orderUpdates ? 'bg-primary' : 'bg-gray-200'
                        }`}
                      >
                        <span className="sr-only">Toggle Order Updates</span>
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                            settings.notifications.orderUpdates ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Newsletter</h4>
                        <p className="text-xs text-gray-500">Berita terbaru dan tips penggunaan akun premium</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleChange('notifications', 'newsletter')}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                          settings.notifications.newsletter ? 'bg-primary' : 'bg-gray-200'
                        }`}
                      >
                        <span className="sr-only">Toggle Newsletter</span>
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                            settings.notifications.newsletter ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Konten tab untuk privasi */}
            {activeTab === 'privacy' && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    <div className="flex items-center">
                      <FiShield className="mr-2 h-5 w-5 text-primary" />
                      Privasi & Keamanan
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Visibilitas Profil</h4>
                      <p className="text-xs text-gray-500 mb-2">Pilih siapa yang dapat melihat profil Anda</p>
                      <select
                        value={settings.privacy.profileVisibility}
                        onChange={(e) => handleSelectChange('privacy', 'profileVisibility', e.target.value)}
                        className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      >
                        <option value="public">Semua orang</option>
                        <option value="friends">Hanya teman</option>
                        <option value="private">Hanya saya</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Berbagi Aktivitas</h4>
                        <p className="text-xs text-gray-500">Bagikan informasi pembelian dan aktivitas Anda</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleChange('privacy', 'shareActivity')}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                          settings.privacy.shareActivity ? 'bg-primary' : 'bg-gray-200'
                        }`}
                      >
                        <span className="sr-only">Toggle Activity Sharing</span>
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                            settings.privacy.shareActivity ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Pengumpulan Data</h4>
                        <p className="text-xs text-gray-500">Izinkan kami mengumpulkan data untuk memperbaiki layanan</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleChange('privacy', 'allowDataCollection')}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                          settings.privacy.allowDataCollection ? 'bg-primary' : 'bg-gray-200'
                        }`}
                      >
                        <span className="sr-only">Toggle Data Collection</span>
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                            settings.privacy.allowDataCollection ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Opsi Keamanan</h4>
                      
                      <Button
                        type="button"
                        className="w-full md:w-auto mb-3 bg-blue-600 hover:bg-blue-700"
                        onClick={() => {}}
                      >
                        <FiLock className="mr-2 h-4 w-4" />
                        Ubah Password
                      </Button>
                      
                      <div className="mt-4">
                        <Button
                          type="button"
                          className="w-full md:w-auto bg-red-600 hover:bg-red-700"
                          onClick={() => {}}
                        >
                          Hapus Akun Saya
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">
                          Perhatian: Menghapus akun akan menghilangkan semua data Anda dan tidak dapat dikembalikan.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Konten tab untuk preferensi */}
            {activeTab === 'preferences' && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    <div className="flex items-center">
                      <FiGlobe className="mr-2 h-5 w-5 text-primary" />
                      Preferensi
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Bahasa</h4>
                      <p className="text-xs text-gray-500 mb-2">Pilih bahasa untuk tampilan aplikasi</p>
                      <select
                        value={settings.preferences.language}
                        onChange={(e) => handleSelectChange('preferences', 'language', e.target.value)}
                        className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                      >
                        <option value="id">Indonesia</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Mode Gelap</h4>
                        <p className="text-xs text-gray-500">Aktifkan tampilan mode gelap</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleChange('preferences', 'darkMode')}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                          settings.preferences.darkMode ? 'bg-primary' : 'bg-gray-200'
                        }`}
                      >
                        <span className="sr-only">Toggle Dark Mode</span>
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                            settings.preferences.darkMode ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Auto-play Video</h4>
                        <p className="text-xs text-gray-500">Putar video secara otomatis saat melihat produk</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleChange('preferences', 'autoPlayVideos')}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                          settings.preferences.autoPlayVideos ? 'bg-primary' : 'bg-gray-200'
                        }`}
                      >
                        <span className="sr-only">Toggle Auto-play Videos</span>
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                            settings.preferences.autoPlayVideos ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="mt-6 flex justify-end">
              <Button
                type="button"
                onClick={handleSaveSettings}
                isLoading={isSaving}
                disabled={isSaving}
                className="w-full md:w-auto"
              >
                <FiSave className="mr-2 h-4 w-4" />
                Simpan Pengaturan
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 