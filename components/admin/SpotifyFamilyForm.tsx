import { useState, useEffect } from 'react';
import { FiPlus, FiTrash, FiSave, FiUser, FiKey, FiAward } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface SpotifySlot {
  id?: string;
  slotName: string;
  email: string | null;
  password: string | null;
  isAllocated: boolean;
  isActive: boolean;
  isMainAccount?: boolean;
  userId?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface SpotifyFamilyFormProps {
  accountId: string;
  isFamilyPlan: boolean;
  maxSlots: number;
}

const SpotifyFamilyForm = ({ accountId, isFamilyPlan, maxSlots }: SpotifyFamilyFormProps) => {
  const [slots, setSlots] = useState<SpotifySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [newSlot, setNewSlot] = useState<SpotifySlot>({
    slotName: '',
    email: '',
    password: '',
    isAllocated: false,
    isActive: true,
    isMainAccount: false
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accountId && isFamilyPlan) {
      fetchSlots();
    }
  }, [accountId, isFamilyPlan]);

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
      let hasMainAccount = slotsData.some((slot) => slot.isMainAccount);
      
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
    if (!newSlot.email || !newSlot.password) {
      toast.error('Email dan password harus diisi');
      return;
    }
    
    try {
      setLoading(true);
      
      // Otomatis membuat nama slot berdasarkan posisi dan jenis
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
          isMainAccount: isFirstSlot
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Gagal menambahkan slot');
        return;
      }
      
      const data = await response.json();
      toast.success('Slot berhasil ditambahkan');
      
      // Reset form
      setNewSlot({
        slotName: '',
        email: '',
        password: '',
        isAllocated: false,
        isActive: true,
        isMainAccount: false
      });
      
      fetchSlots();
    } catch (error) {
      console.error('Error adding slot:', error);
      toast.error('Terjadi kesalahan saat menambahkan slot');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSlot = async (slot: SpotifySlot) => {
    if (!slot.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/spotify-slots/${slot.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slotName: slot.slotName,
          email: slot.email,
          password: slot.password,
          isActive: slot.isActive,
          isMainAccount: slot.isMainAccount
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Slot berhasil diperbarui');
        setEditingSlot(null);
        fetchSlots();
      } else {
        toast.error(data.message || 'Gagal memperbarui slot');
      }
    } catch (error) {
      console.error('Error updating slot:', error);
      toast.error('Terjadi kesalahan saat memperbarui slot');
    } finally {
      setLoading(false);
    }
  };

  const handleSetMainAccount = async (slotId: string) => {
    // Perbarui state lokal terlebih dahulu
    const updatedSlots = slots.map(slot => ({
      ...slot,
      isMainAccount: slot.id === slotId
    }));
    setSlots(updatedSlots);
    
    // Temukan slot yang akan dijadikan akun utama
    const targetSlot = slots.find(slot => slot.id === slotId);
    if (!targetSlot) return;
    
    try {
      setLoading(true);
      
      // Update semua slot untuk menghapus flag isMainAccount
      for (const slot of slots) {
        if (slot.id && slot.isMainAccount) {
          await fetch(`/api/admin/spotify-slots/${slot.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...slot,
              isMainAccount: false
            }),
          });
        }
      }
      
      // Tetapkan slot yang dipilih sebagai akun utama
      const response = await fetch(`/api/admin/spotify-slots/${slotId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...targetSlot,
          isMainAccount: true
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Akun utama berhasil diperbarui');
        fetchSlots();
      } else {
        toast.error(data.message || 'Gagal memperbarui akun utama');
        fetchSlots(); // Refresh data untuk mendapatkan state yang benar
      }
    } catch (error) {
      console.error('Error setting main account:', error);
      toast.error('Terjadi kesalahan saat menetapkan akun utama');
      fetchSlots(); // Refresh data untuk mendapatkan state yang benar
    } finally {
      setLoading(false);
    }
  };

  const handleDeallocateSlot = async (slotId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus alokasi slot ini?')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/spotify-slots/${slotId}/deallocate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Alokasi slot berhasil dihapus');
        fetchSlots();
      } else {
        toast.error(data.message || 'Gagal menghapus alokasi slot');
      }
    } catch (error) {
      console.error('Error deallocating slot:', error);
      toast.error('Terjadi kesalahan saat menghapus alokasi slot');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    // Periksa apakah ini akun utama
    const isMain = slots.find(slot => slot.id === slotId)?.isMainAccount;
    
    if (isMain) {
      toast.error('Tidak dapat menghapus akun utama (HEAD/PEMILIK) Family Plan');
      return;
    }
    
    if (!confirm('Apakah Anda yakin ingin menghapus slot ini? Ini akan menghapus akses pengguna yang menggunakan slot ini.')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/spotify-slots/${slotId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Slot berhasil dihapus');
        fetchSlots();
      } else {
        toast.error(data.message || 'Gagal menghapus slot');
      }
    } catch (error) {
      console.error('Error deleting slot:', error);
      toast.error('Terjadi kesalahan saat menghapus slot');
    } finally {
      setLoading(false);
    }
  };

  const startEditSlot = (slot: SpotifySlot) => {
    setEditingSlot(slot.id || null);
  };

  const cancelEditSlot = () => {
    setEditingSlot(null);
  };

  if (!isFamilyPlan) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700">
        <p>Akun ini bukan Family Plan. Aktifkan Family Plan untuk mengelola slot.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Manajemen Spotify Family Plan</h3>
      
      <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6 rounded-r-md">
        <div className="flex items-start">
          <FiAward className="text-indigo-600 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-indigo-800">Pemilik Family Plan (HEAD)</h4>
            <p className="text-sm text-indigo-700">
              Setiap Family Plan harus memiliki satu akun utama (HEAD/PEMILIK) yang mengelola langganan.
              Akun ini akan ditandai dengan ikon mahkota. Member lain dalam family plan harus berbagi alamat yang sama dengan pemilik akun.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Total Slot: {slots.length} / {maxSlots || 6}
        </p>
        <button
          onClick={() => setIsAdding(!isAdding)}
          disabled={loading || slots.length >= (maxSlots || 6)}
          className={`text-sm px-3 py-1.5 rounded flex items-center ${
            slots.length >= (maxSlots || 6)
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-50 text-green-600 hover:bg-green-100'
          }`}
        >
          <FiPlus className="mr-1" /> Tambah Slot
        </button>
      </div>
      
      {/* Form tambah slot baru */}
      {isAdding && (
        <div className="mb-6 p-4 border rounded-md bg-gray-50">
          <h4 className="text-sm font-medium mb-3">Tambah Slot Baru</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-700 mb-1">
                Email Pengguna (opsional)
              </label>
              <input
                type="email"
                value={newSlot.email || ''}
                onChange={(e) => setNewSlot({...newSlot, email: e.target.value || null})}
                placeholder="email@contoh.com"
                className="w-full px-3 py-2 border rounded text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-700 mb-1">
                Password (opsional)
              </label>
              <input
                type="text"
                value={newSlot.password || ''}
                onChange={(e) => setNewSlot({...newSlot, password: e.target.value || null})}
                placeholder="password123"
                className="w-full px-3 py-2 border rounded text-sm"
              />
            </div>
          </div>
          
          {/* Opsi untuk akun utama (hanya tampilkan jika belum ada akun utama) */}
          {!slots.some(slot => slot.isMainAccount) && (
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="isMainAccount"
                checked={newSlot.isMainAccount}
                onChange={(e) => setNewSlot({...newSlot, isMainAccount: e.target.checked})}
                className="h-4 w-4 text-indigo-600 rounded border-gray-300"
              />
              <label htmlFor="isMainAccount" className="ml-2 text-sm text-gray-700 flex items-center">
                <FiAward className="text-yellow-500 mr-1" /> Jadikan akun utama (HEAD/PEMILIK)
              </label>
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleAddSlot}
              disabled={loading}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Slot'}
            </button>
          </div>
        </div>
      )}
      
      {/* Daftar slot */}
      <div className="mt-4 flex flex-col gap-4">
        {loading && slots.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500">Memuat data slot...</p>
          </div>
        ) : slots.length === 0 ? (
          <div className="bg-gray-50 p-4 rounded-md text-center">
            <p className="text-gray-500">Belum ada slot yang dibuat. Tambahkan slot baru untuk memulai.</p>
          </div>
        ) : (
          slots.map((slot) => (
            <div key={slot.id} className={`border rounded-md p-4 ${
              editingSlot === slot.id ? 'bg-blue-50 border-blue-200' : 
              slot.isMainAccount ? 'bg-yellow-50 border-yellow-200' :
              slot.isAllocated ? 'bg-green-50 border-green-200' : 'bg-white'
            }`}>
              {editingSlot === slot.id ? (
                // Form edit slot
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-blue-800">Edit Slot</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => cancelEditSlot()}
                        className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => handleUpdateSlot(slot)}
                        disabled={loading}
                        className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">
                      Nama Slot <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={slot.slotName}
                      onChange={(e) => {
                        const updatedSlots = slots.map(s => 
                          s.id === slot.id ? { ...s, slotName: e.target.value } : s
                        );
                        setSlots(updatedSlots);
                      }}
                      className="w-full px-3 py-1.5 border rounded text-sm"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">
                        Email Pengguna
                      </label>
                      <input
                        type="email"
                        value={slot.email || ''}
                        onChange={(e) => {
                          const updatedSlots = slots.map(s => 
                            s.id === slot.id ? { ...s, email: e.target.value || null } : s
                          );
                          setSlots(updatedSlots);
                        }}
                        className="w-full px-3 py-1.5 border rounded text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">
                        Password
                      </label>
                      <input
                        type="text"
                        value={slot.password || ''}
                        onChange={(e) => {
                          const updatedSlots = slots.map(s => 
                            s.id === slot.id ? { ...s, password: e.target.value || null } : s
                          );
                          setSlots(updatedSlots);
                        }}
                        className="w-full px-3 py-1.5 border rounded text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id={`slot-active-${slot.id}`}
                      type="checkbox"
                      checked={slot.isActive}
                      onChange={(e) => {
                        const updatedSlots = slots.map(s => 
                          s.id === slot.id ? { ...s, isActive: e.target.checked } : s
                        );
                        setSlots(updatedSlots);
                      }}
                      className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                    />
                    <label htmlFor={`slot-active-${slot.id}`} className="ml-2 text-sm text-gray-700">
                      Slot aktif dan dapat digunakan
                    </label>
                  </div>
                </div>
              ) : (
                // Tampilan slot normal
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center">
                        {slot.isMainAccount ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500 text-white mr-2">
                            <FiAward className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium mr-2 ${
                            slot.isAllocated 
                              ? 'bg-green-500 text-white' 
                              : slot.isActive 
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-gray-200 text-gray-600'
                          }`}>
                            {(slots.indexOf(slot) + 1)}
                          </span>
                        )}
                        <h4 className="font-medium text-gray-900">{slot.slotName}</h4>
                        {slot.isMainAccount && (
                          <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center">
                            <FiAward className="mr-1 w-3 h-3" /> HEAD/PEMILIK
                          </span>
                        )}
                        {slot.isAllocated && (
                          <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                            Terpakai
                          </span>
                        )}
                        {!slot.isActive && (
                          <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                            Nonaktif
                          </span>
                        )}
                      </div>
                      
                      {slot.user && (
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <FiUser className="w-3 h-3 mr-1" />
                          <span>Digunakan oleh: {slot.user.name} ({slot.user.email})</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEditSlot(slot)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Edit slot"
                      >
                        <FiSave className="w-4 h-4" />
                      </button>
                      
                      {!slot.isMainAccount && (
                        <button
                          onClick={() => handleSetMainAccount(slot.id!)}
                          className="text-yellow-600 hover:text-yellow-800 p-1"
                          title="Jadikan akun utama"
                          disabled={loading}
                        >
                          <FiAward className="w-4 h-4" />
                        </button>
                      )}
                      
                      {slot.isAllocated ? (
                        <button
                          onClick={() => handleDeallocateSlot(slot.id!)}
                          className="text-orange-600 hover:text-orange-800 p-1"
                          title="Hapus alokasi"
                          disabled={loading}
                        >
                          <FiUser className="w-4 h-4" />
                        </button>
                      ) : !slot.isMainAccount ? (
                        <button
                          onClick={() => handleDeleteSlot(slot.id!)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Hapus slot"
                          disabled={loading}
                        >
                          <FiTrash className="w-4 h-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Email</label>
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={slot.email || ''}
                          readOnly
                          className={`w-full px-2 py-1 text-sm border rounded ${
                            slot.isMainAccount ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
                          }`}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Password</label>
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={slot.password || ''}
                          readOnly
                          className={`w-full px-2 py-1 text-sm border rounded ${
                            slot.isMainAccount ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {slot.isMainAccount && (
                    <div className="mt-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-800">
                      <p>
                        <strong>Catatan:</strong> Ini adalah akun utama (HEAD/PEMILIK) dari Family Plan. 
                        Akun ini yang membayar langganan dan mengelola Family Plan di Spotify.
                        Akun utama tidak dapat dihapus jika masih ada slot member lain.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SpotifyFamilyForm; 