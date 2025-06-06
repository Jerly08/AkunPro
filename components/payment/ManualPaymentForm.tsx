'use client';

import { useState, useRef, useEffect } from 'react';
import { FiUpload, FiCheck, FiX, FiLoader } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';

interface ManualPaymentFormProps {
  orderId: string;
  totalAmount: number;
  onSuccess: () => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

const ManualPaymentForm = ({ orderId, totalAmount, onSuccess }: ManualPaymentFormProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup object URLs when component unmounts or when preview changes
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file size
      if (selectedFile.size > MAX_FILE_SIZE) {
        toast.error('Ukuran file terlalu besar. Maksimal 2MB');
        return;
      }
      
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
        toast.error('Format file tidak didukung. Gunakan JPG atau PNG');
        return;
      }
      
      setFile(selectedFile);
      
      // Revoke previous object URL if exists
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
      
      // Use createObjectURL instead of FileReader for better performance
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
    }
  };

  const clearFile = () => {
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Silakan unggah bukti pembayaran terlebih dahulu');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create form data with minimal fields
      const formData = new FormData();
      formData.append('proofFile', file);
      formData.append('orderId', orderId);
      
      // Only add notes if not empty
      if (notes.trim()) {
        formData.append('notes', notes);
      }
      
      const response = await fetch('/api/payment/manual-transfer', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Terjadi kesalahan saat mengunggah bukti pembayaran');
      }
      
      // Parse minimal JSON
      const result = await response.json();
      
      // Show success message
      toast.success('Bukti pembayaran berhasil di kirim menunngu konfirmasi admin');
      
      // Call the onSuccess callback
      onSuccess();
      
      // Clean up resources
      clearFile();
      setNotes('');
      
    } catch (error) {
      console.error('Error uploading payment proof:', error);
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan saat mengunggah bukti pembayaran');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Payment Instructions - Improved for mobile */}
      <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-md text-yellow-800">
        <p className="font-medium mb-2 text-sm sm:text-base">Petunjuk Pembayaran</p>
        <ol className="list-decimal list-inside space-y-2 ml-1 text-sm">
          <li>Transfer tepat Rp {totalAmount.toLocaleString()} ke rekening yang tertera di atas</li>
          <li>Simpan bukti transfer (screenshot/foto)</li>
          <li>Unggah bukti transfer menggunakan form di bawah ini</li>
          <li>Admin akan memverifikasi pembayaran Anda dalam 1x24 jam</li>
        </ol>
      </div>
      
      {/* Upload Container - Better for mobile with larger touch areas */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-indigo-500 transition-colors cursor-pointer relative"
        onClick={() => {
          if (!preview) {
            fileInputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!preview) {
              fileInputRef.current?.click();
            }
          }
        }}
      >
        {preview ? (
          <div className="relative">
            <img 
              src={preview} 
              alt="Bukti pembayaran" 
              className="max-h-64 max-w-full mx-auto rounded-md object-contain" 
              loading="lazy"
            />
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors z-10"
              title="Hapus gambar"
              aria-label="Hapus gambar"
            >
              <FiX size={18} />
            </button>
          </div>
        ) : (
          <div className="py-6">
            <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-3 text-base text-gray-600">
              Klik untuk mengunggah bukti pembayaran
            </p>
            <p className="text-xs text-gray-500 mt-2">
              JPG atau PNG, maksimal 2MB
            </p>
          </div>
        )}
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/jpg"
          className="hidden"
          aria-label="Upload bukti pembayaran"
        />
      </div>
      
      {/* Notes Section - Improved spacing */}
      <div className="mt-4">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          Catatan (opsional)
        </label>
        <textarea
          id="notes"
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Tambahkan catatan untuk admin jika diperlukan..."
        />
      </div>
      
      {/* Submit Button - Larger touch target */}
      <Button
        type="submit"
        variant="primary"
        className="w-full py-3 mt-6 text-base font-medium"
        disabled={loading || !file}
      >
        {loading ? (
          <>
            <FiLoader className="animate-spin mr-2" size={18} />
            <span>Mengunggah...</span>
          </>
        ) : (
          <>
            <FiCheck className="mr-2" size={18} />
            <span>Konfirmasi Pembayaran</span>
          </>
        )}
      </Button>
    </form>
  );
};

export default ManualPaymentForm; 