'use client';

import { useState } from 'react';
import { FiSave, FiInfo, FiCheckCircle } from 'react-icons/fi';
import AdminHeader from '@/components/admin/AdminHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function SettingsPage() {
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'AkunPro',
    siteDescription: 'Marketplace akun premium Netflix dan Spotify',
    contactEmail: 'admin@akunpro.com',
    phoneNumber: '+628123456789',
    address: 'Jl. Contoh No. 123, Jakarta Selatan',
  });

  const [paymentSettings, setPaymentSettings] = useState({
    enableQRIS: true,
    qrisExpiry: 30, // dalam menit
    enableBankTransfer: true,
    bankName: 'Bank Central Asia (BCA)',
    accountNumber: '1234567890',
    accountName: 'PT Akun Pro Indonesia',
  });

  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'notifikasi@akunpro.com',
    smtpPassword: '**********************',
    senderName: 'AkunPro Notification',
    senderEmail: 'notifikasi@akunpro.com',
  });

  const [saveStatus, setSaveStatus] = useState<{ type: string; message: string } | null>(null);

  const handleGeneralSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setGeneralSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePaymentSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setPaymentSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEmailSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmailSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveSettings = (settingType: string) => {
    // Dalam implementasi nyata, kirim data ke API
    console.log(`Menyimpan pengaturan ${settingType}:`, 
      settingType === 'general' ? generalSettings : 
      settingType === 'payment' ? paymentSettings : 
      emailSettings
    );
    
    // Tampilkan pesan sukses
    setSaveStatus({ 
      type: 'success', 
      message: `Pengaturan ${
        settingType === 'general' ? 'umum' : 
        settingType === 'payment' ? 'pembayaran' : 
        'email'
      } berhasil disimpan!` 
    });
    
    // Hilangkan pesan setelah 3 detik
    setTimeout(() => {
      setSaveStatus(null);
    }, 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AdminHeader title="Pengaturan" />

      {saveStatus && (
        <div className={`mb-4 p-4 rounded-md flex items-center ${
          saveStatus.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {saveStatus.type === 'success' ? (
            <FiCheckCircle className="h-5 w-5 mr-2" />
          ) : (
            <FiInfo className="h-5 w-5 mr-2" />
          )}
          <p>{saveStatus.message}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Pengaturan Umum */}
        <Card>
          <CardHeader>
            <CardTitle>Pengaturan Umum</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label htmlFor="siteName" className="block text-sm font-medium text-gray-700">
                  Nama Situs
                </label>
                <input
                  type="text"
                  id="siteName"
                  name="siteName"
                  value={generalSettings.siteName}
                  onChange={handleGeneralSettingsChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700">
                  Deskripsi Situs
                </label>
                <textarea
                  id="siteDescription"
                  name="siteDescription"
                  rows={3}
                  value={generalSettings.siteDescription}
                  onChange={handleGeneralSettingsChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                  Email Kontak
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={generalSettings.contactEmail}
                  onChange={handleGeneralSettingsChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                  Nomor Telepon
                </label>
                <input
                  type="text"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={generalSettings.phoneNumber}
                  onChange={handleGeneralSettingsChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Alamat
                </label>
                <textarea
                  id="address"
                  name="address"
                  rows={2}
                  value={generalSettings.address}
                  onChange={handleGeneralSettingsChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div className="flex justify-end">
                <Button 
                  variant="primary"
                  onClick={() => handleSaveSettings('general')}
                  className="flex items-center"
                >
                  <FiSave className="mr-2" /> Simpan Pengaturan Umum
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pengaturan Pembayaran */}
        <Card>
          <CardHeader>
            <CardTitle>Pengaturan Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableQRIS"
                  name="enableQRIS"
                  checked={paymentSettings.enableQRIS}
                  onChange={handlePaymentSettingsChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="enableQRIS" className="ml-2 block text-sm font-medium text-gray-700">
                  Aktifkan Pembayaran QRIS
                </label>
              </div>
              
              <div>
                <label htmlFor="qrisExpiry" className="block text-sm font-medium text-gray-700">
                  Batas Waktu QRIS (Menit)
                </label>
                <input
                  type="number"
                  id="qrisExpiry"
                  name="qrisExpiry"
                  value={paymentSettings.qrisExpiry}
                  onChange={handlePaymentSettingsChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableBankTransfer"
                  name="enableBankTransfer"
                  checked={paymentSettings.enableBankTransfer}
                  onChange={handlePaymentSettingsChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="enableBankTransfer" className="ml-2 block text-sm font-medium text-gray-700">
                  Aktifkan Pembayaran Transfer Bank
                </label>
              </div>
              
              <div>
                <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
                  Nama Bank
                </label>
                <input
                  type="text"
                  id="bankName"
                  name="bankName"
                  value={paymentSettings.bankName}
                  onChange={handlePaymentSettingsChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
                  Nomor Rekening
                </label>
                <input
                  type="text"
                  id="accountNumber"
                  name="accountNumber"
                  value={paymentSettings.accountNumber}
                  onChange={handlePaymentSettingsChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">
                  Nama Pemilik Rekening
                </label>
                <input
                  type="text"
                  id="accountName"
                  name="accountName"
                  value={paymentSettings.accountName}
                  onChange={handlePaymentSettingsChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div className="flex justify-end">
                <Button 
                  variant="primary"
                  onClick={() => handleSaveSettings('payment')}
                  className="flex items-center"
                >
                  <FiSave className="mr-2" /> Simpan Pengaturan Pembayaran
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pengaturan Email */}
        <Card>
          <CardHeader>
            <CardTitle>Pengaturan Email</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label htmlFor="smtpHost" className="block text-sm font-medium text-gray-700">
                  SMTP Host
                </label>
                <input
                  type="text"
                  id="smtpHost"
                  name="smtpHost"
                  value={emailSettings.smtpHost}
                  onChange={handleEmailSettingsChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="smtpPort" className="block text-sm font-medium text-gray-700">
                  SMTP Port
                </label>
                <input
                  type="number"
                  id="smtpPort"
                  name="smtpPort"
                  value={emailSettings.smtpPort}
                  onChange={handleEmailSettingsChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="smtpUser" className="block text-sm font-medium text-gray-700">
                  SMTP Username
                </label>
                <input
                  type="text"
                  id="smtpUser"
                  name="smtpUser"
                  value={emailSettings.smtpUser}
                  onChange={handleEmailSettingsChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="smtpPassword" className="block text-sm font-medium text-gray-700">
                  SMTP Password
                </label>
                <input
                  type="password"
                  id="smtpPassword"
                  name="smtpPassword"
                  value={emailSettings.smtpPassword}
                  onChange={handleEmailSettingsChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="senderName" className="block text-sm font-medium text-gray-700">
                  Nama Pengirim
                </label>
                <input
                  type="text"
                  id="senderName"
                  name="senderName"
                  value={emailSettings.senderName}
                  onChange={handleEmailSettingsChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="senderEmail" className="block text-sm font-medium text-gray-700">
                  Email Pengirim
                </label>
                <input
                  type="email"
                  id="senderEmail"
                  name="senderEmail"
                  value={emailSettings.senderEmail}
                  onChange={handleEmailSettingsChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div className="flex justify-end">
                <Button 
                  variant="primary"
                  onClick={() => handleSaveSettings('email')}
                  className="flex items-center"
                >
                  <FiSave className="mr-2" /> Simpan Pengaturan Email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 