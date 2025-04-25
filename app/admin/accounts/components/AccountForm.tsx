import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// Definisi tipe yang diperluas dari Account dengan field family plan
interface ExtendedAccount {
  id: string;
  type: string;
  accountEmail: string;
  accountPassword: string;
  price: number;
  description: string;
  warranty: number;
  isActive: boolean;
  duration: number;
  stock: number;
  isFamilyPlan?: boolean;
  maxSlots?: number;
  createdAt: Date;
  updatedAt: Date;
  seller?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface AccountFormProps {
  account: ExtendedAccount;
}

const AccountForm = ({ account }: AccountFormProps) => {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    type: account.type,
    accountEmail: account.accountEmail,
    accountPassword: account.accountPassword,
    price: account.price.toString(),
    description: account.description,
    warranty: account.warranty.toString(),
    duration: account.duration.toString(),
    stock: account.stock.toString(),
    isActive: account.isActive,
    isFamilyPlan: account.isFamilyPlan || false,
    maxSlots: account.maxSlots?.toString() || '1',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/accounts/${account.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          warranty: parseInt(formData.warranty),
          duration: parseInt(formData.duration),
          stock: parseInt(formData.stock),
          maxSlots: parseInt(formData.maxSlots),
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Akun berhasil diperbarui');
        router.refresh();
      } else {
        toast.error(data.message || 'Gagal memperbarui akun');
      }
    } catch (error) {
      console.error('Error updating account:', error);
      toast.error('Terjadi kesalahan saat memperbarui akun');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            Tipe Akun
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="NETFLIX">Netflix</option>
            <option value="SPOTIFY">Spotify</option>
            <option value="DISNEY">Disney+</option>
            <option value="YOUTUBE">YouTube Premium</option>
            <option value="APPLE">Apple TV+</option>
            <option value="HBO">HBO Max</option>
            <option value="GAMING">Gaming</option>
            <option value="VPN">VPN</option>
            <option value="CLOUD">Cloud Storage</option>
            <option value="EDUCATION">Education</option>
            <option value="OTHER">Lainnya</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="accountEmail" className="block text-sm font-medium text-gray-700">
            Email Akun
          </label>
          <input
            type="email"
            id="accountEmail"
            name="accountEmail"
            value={formData.accountEmail}
            onChange={handleChange}
            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div>
          <label htmlFor="accountPassword" className="block text-sm font-medium text-gray-700">
            Password Akun
          </label>
          <input
            type="text"
            id="accountPassword"
            name="accountPassword"
            value={formData.accountPassword}
            onChange={handleChange}
            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Harga (Rp)
          </label>
          <input
            type="number"
            step="1000"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div>
          <label htmlFor="warranty" className="block text-sm font-medium text-gray-700">
            Garansi (hari)
          </label>
          <input
            type="number"
            id="warranty"
            name="warranty"
            value={formData.warranty}
            onChange={handleChange}
            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
            Durasi (bulan)
          </label>
          <input
            type="number"
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div>
          <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
            Stok
          </label>
          <input
            type="number"
            id="stock"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        <div className="flex items-center">
          <input
            id="isActive"
            name="isActive"
            type="checkbox"
            checked={formData.isActive}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
            Akun Aktif
          </label>
        </div>
        
        {formData.type === 'SPOTIFY' && (
          <div className="flex items-center">
            <input
              id="isFamilyPlan"
              name="isFamilyPlan"
              type="checkbox"
              checked={formData.isFamilyPlan}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="isFamilyPlan" className="ml-2 block text-sm text-gray-700">
              Family Plan
            </label>
          </div>
        )}
      </div>
      
      {formData.type === 'SPOTIFY' && formData.isFamilyPlan && (
        <div>
          <label htmlFor="maxSlots" className="block text-sm font-medium text-gray-700">
            Jumlah Slot
          </label>
          <input
            type="number"
            id="maxSlots"
            name="maxSlots"
            min="1"
            max="6"
            value={formData.maxSlots}
            onChange={handleChange}
            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
          />
          <p className="mt-1 text-xs text-gray-500">
            Maksimal 6 slot untuk akun Family Plan
          </p>
        </div>
      )}
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Deskripsi
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={formData.description}
          onChange={handleChange}
          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
          required
        />
      </div>
      
      <div className="pt-5">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.refresh()}
            className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
          >
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default AccountForm; 