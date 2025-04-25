import { useState, useEffect } from 'react';
import { FiPlus, FiTrash, FiSave, FiUser, FiKey, FiAward, FiEdit2, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface SpotifySlot {
  id: string;
  email: string;
  password: string;
  isMainAccount: boolean;
  userId: string | null;
  userEmail: string | null;
  currentOrderId: string | null;
  orderId: string | null;
  accountId: string;
}

interface SpotifyFamilyFormProps {
  accountId: string;
  isFamilyPlan: boolean;
  maxSlots: number;
}

const SpotifyFamilyForm = ({ accountId, isFamilyPlan, maxSlots }: SpotifyFamilyFormProps) => {
  const [slots, setSlots] = useState<SpotifySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newSlot, setNewSlot] = useState({ email: '', password: '' });
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (accountId) {
      fetchSlots();
    }
  }, [accountId, isFamilyPlan]);

  // After adding/deleting/updating a slot, update stock
  const updateAccountStock = async (accountId: string) => {
    try {
      // Use the new API endpoint instead of directly calling SpotifyService
      const response = await fetch('/api/admin/spotify-slots/update-account-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update account stock');
      }
      
      const result = await response.json();
      console.log(`Stock updated for account: ${accountId}`, result);
    } catch (error) {
      console.error('Error updating stock after slot change:', error);
    }
  };

  const fetchSlots = async () => {
    if (!isFamilyPlan) {
      setLoading(false);
      setSlots([]);
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/spotify-slots/${accountId}`);
      
      if (!response.ok) {
        throw new Error('Gagal mengambil data slot');
      }
      
      const data = await response.json();
      
      // Periksa format respons - yang baru mengembalikan objek dengan property slots
      const slotsData = Array.isArray(data) ? data : (data.slots || []);
      
      // Pastikan selalu ada 1 main account
      let hasMainAccount = slotsData.some((slot: SpotifySlot) => slot.isMainAccount);
      
      // Jika tidak ada main account, tetapkan slot pertama sebagai main account
      if (!hasMainAccount && slotsData.length > 0) {
        const updatedData = [...slotsData];
        updatedData[0].isMainAccount = true;
        
        // Update di server
        await fetch(`/api/admin/spotify-slots/${updatedData[0].id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isMainAccount: true }),
        });
        
        setSlots(updatedData);
      } else {
        setSlots(slotsData);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      setError('Terjadi kesalahan saat mengambil data slot');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async () => {
    if (!isFamilyPlan) {
      toast.error('Akun ini belum diaktifkan sebagai Family Plan. Silakan aktifkan Family Plan terlebih dahulu.');
      return;
    }

    if (!newSlot.email || !newSlot.password) {
      toast.error('Email dan password harus diisi');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const isFirstSlot = slots.length === 0;
      const slotName = isFirstSlot ? 'Head Account' : `Slot ${slots.length + 1}`;
      
      const response = await fetch(`/api/admin/spotify-slots/${accountId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newSlot,
          slotName,
          isMainAccount: isFirstSlot // Jika ini slot pertama, jadikan sebagai akun utama
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API response:", errorData);
        throw new Error(errorData.message || 'Gagal menambahkan slot');
      }
      
      toast.success('Slot berhasil ditambahkan');
      setNewSlot({ email: '', password: '' });
      await updateAccountStock(accountId);
      await fetchSlots();
    } catch (error) {
      console.error('Error adding slot:', error);
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan saat menambahkan slot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSlot = async (id: string, data: Partial<SpotifySlot>) => {
    try {
      setSubmitting(true);
      
      const response = await fetch(`/api/admin/spotify-slots/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengupdate slot');
      }
      
      toast.success('Slot berhasil diupdate');
      setEditingSlotId(null);
      await updateAccountStock(accountId);
      await fetchSlots();
    } catch (error) {
      console.error('Error updating slot:', error);
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan saat mengupdate slot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    // Cek apakah slot adalah akun utama dan terdapat slot lain
    const slot = slots.find(s => s.id === id);
    if (slot?.isMainAccount && slots.length > 1) {
      toast.error('Tidak dapat menghapus akun utama. Tetapkan akun lain sebagai akun utama terlebih dahulu.');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Use the new API endpoint that handles both slot deletion and stock update
      const response = await fetch('/api/admin/spotify-slots/update-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slotId: id }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menghapus slot');
      }
      
      toast.success('Slot berhasil dihapus');
      await fetchSlots(); // Refresh the slots list
    } catch (error) {
      console.error('Error deleting slot:', error);
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan saat menghapus slot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetMainAccount = async (id: string) => {
    try {
      setSubmitting(true);
      
      // Update semua slot untuk menghapus status main account
      const updatedSlots = slots.map(slot => ({
        ...slot,
        isMainAccount: slot.id === id
      }));
      
      // Update di server
      const response = await fetch(`/api/admin/spotify-slots/${id}/set-main`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menetapkan akun utama');
      }
      
      toast.success('Akun utama berhasil diperbarui');
      setSlots(updatedSlots);
      
      // Update stock via API endpoint
      await fetch('/api/admin/spotify-slots/update-account-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId }),
      });
      
      // Refresh slots data
      await fetchSlots();
    } catch (error) {
      console.error('Error setting main account:', error);
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan saat menetapkan akun utama');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeallocateSlot = async (id: string) => {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/admin/spotify-slots/${id}/deallocate`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mendealokasi slot');
      }
      
      toast.success('Slot berhasil didealokasi dari pengguna');
      
      // Update stock via API endpoint
      await fetch('/api/admin/spotify-slots/update-account-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId }),
      });
      
      await fetchSlots();
    } catch (error) {
      console.error('Error deallocating slot:', error);
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan saat mendealokasi slot');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isFamilyPlan) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiAlertCircle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <span className="font-medium">Akun ini bukan Family Plan.</span> Aktifkan Family Plan untuk mengelola slot.
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              Untuk mengaktifkan Family Plan, klik "Aktifkan Family Plan" pada bagian atas modal ini.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center my-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div></div>;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Manajemen Spotify Family Plan</h3>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-2">
          Family Plan memungkinkan hingga {maxSlots} pengguna menggunakan satu akun Spotify Premium. 
          Anda dapat mendaftarkan alamat email dan password untuk setiap slot.
        </p>
        
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAward className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Akun Utama (HEAD/PEMILIK):</span> Setiap Family Plan harus memiliki satu akun utama. 
                Akun ini memiliki kontrol penuh atas Family Plan. Untuk menetapkan akun utama, klik ikon mahkota pada slot yang diinginkan.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h4 className="text-md font-medium mb-2">Slot yang Tersedia ({slots.length}/{maxSlots})</h4>
        
        {slots.length === 0 ? (
          <p className="text-sm text-gray-500 italic mb-4">Belum ada slot yang ditambahkan.</p>
        ) : (
          <div className="space-y-4">
            {slots.map((slot) => (
              <div key={slot.id} className={`border rounded-lg p-4 ${slot.isMainAccount ? 'bg-yellow-50 border-yellow-300' : 'bg-white border-gray-200'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-start">
                    {slot.isMainAccount && (
                      <div className="mr-2 text-yellow-600" title="Akun Utama (HEAD/PEMILIK)">
                        <FiAward size={18} />
                      </div>
                    )}
                    <div>
                      {editingSlotId === slot.id ? (
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs text-gray-500">Email</label>
                            <input
                              type="text"
                              value={slot.email || ''}
                              onChange={(e) => {
                                const updatedSlots = slots.map(s =>
                                  s.id === slot.id ? { ...s, email: e.target.value } : s
                                );
                                setSlots(updatedSlots);
                              }}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500">Password</label>
                            <input
                              type="text"
                              value={slot.password || ''}
                              onChange={(e) => {
                                const updatedSlots = slots.map(s =>
                                  s.id === slot.id ? { ...s, password: e.target.value } : s
                                );
                                setSlots(updatedSlots);
                              }}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                handleUpdateSlot(slot.id, {
                                  email: slot.email,
                                  password: slot.password
                                });
                              }}
                              disabled={submitting}
                              className="bg-green-100 text-green-700 px-3 py-1 rounded-md text-sm hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                            >
                              <FiCheckCircle className="inline-block mr-1" size={14} />
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSlotId(null);
                                // Kembalikan data semula
                                fetchSlots();
                              }}
                              className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h5 className="text-sm font-medium">{slot.email}</h5>
                          <p className="text-xs text-gray-500">Password: {slot.password}</p>
                          
                          {slot.userId && (
                            <div className="mt-1 flex items-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Digunakan oleh: {slot.userEmail || 'User ID: ' + slot.userId}
                              </span>
                              <button
                                onClick={() => handleDeallocateSlot(slot.id)}
                                disabled={submitting}
                                className="ml-2 text-xs text-red-600 hover:text-red-800"
                                title="Lepaskan dari pengguna ini"
                              >
                                Lepaskan
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    {!slot.isMainAccount && (
                      <button
                        type="button"
                        onClick={() => handleSetMainAccount(slot.id)}
                        disabled={submitting}
                        className="text-yellow-600 hover:text-yellow-800 p-1"
                        title="Tetapkan sebagai Akun Utama (HEAD/PEMILIK)"
                      >
                        <FiAward size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditingSlotId(slot.id)}
                      disabled={submitting || editingSlotId !== null}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Edit slot"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSlot(slot.id)}
                      disabled={submitting || editingSlotId !== null}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Hapus slot"
                    >
                      <FiTrash size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {slots.length < maxSlots && (
        <div className="border border-gray-200 rounded-lg p-4 mb-6">
          <h4 className="text-md font-medium mb-2">Tambah Slot Baru</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="text"
                value={newSlot.email}
                onChange={(e) => setNewSlot({ ...newSlot, email: e.target.value })}
                placeholder="Email untuk slot baru"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="text"
                value={newSlot.password}
                onChange={(e) => setNewSlot({ ...newSlot, password: e.target.value })}
                placeholder="Password untuk slot baru"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={handleAddSlot}
              disabled={submitting || !newSlot.email || !newSlot.password}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300"
            >
              <FiPlus className="mr-2" />
              Tambah Slot
              {submitting && (
                <span className="ml-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpotifyFamilyForm; 