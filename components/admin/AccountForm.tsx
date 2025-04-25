'use client';

import { useState, useRef, FormEvent, useEffect } from 'react';
import { FiSave, FiPlay, FiMusic, FiPlus, FiTrash, FiDownload, FiUpload, FiCheckCircle } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Account {
  accountEmail: string;
  accountPassword: string;
  profiles?: NetflixProfile[];
}

// Tambahkan interface untuk Netflix Profile
interface NetflixProfile {
  id?: string;
  name: string;
  pin: string;
  isKids: boolean;
  inUse?: boolean;
}

// Interface untuk SpotifySlot
interface SpotifySlot {
  id?: string;
  slotName: string;
  email?: string | null;
  password?: string | null;
  isActive: boolean;
  isAllocated: boolean;
  isMainAccount: boolean;
  userId?: string | null;
}

interface AccountFormProps {
  account?: {
    id: string;
    type: string;
    accountEmail: string;
    accountPassword: string;
    price: number;
    description: string;
    warranty: number;
    isActive: boolean;
    stock?: number;
    duration?: number;
    isFamilyPlan?: boolean;
    maxSlots?: number;
    profiles?: {
      id: string;
      name: string;
      pin: string | null;
      isKids: boolean;
      orderId: string | null;
      userId: string | null;
    }[];
  };
  onSubmit: (formData: FormData) => Promise<void>;
  isSubmitting: boolean;
}

const AccountForm = ({ account, onSubmit, isSubmitting }: AccountFormProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedType, setSelectedType] = useState<string>(account?.type || 'NETFLIX');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [newAccountId, setNewAccountId] = useState<string | null>(null);
  
  // Tambahkan console.log untuk debugging
  console.log("AccountForm props:", {
    accountExists: !!account,
    accountType: account?.type,
    selectedType,
    hasProfiles: account?.profiles && account.profiles.length > 0,
    profilesCount: account?.profiles?.length || 0
  });

  // Pastikan selectedType selalu sinkron dengan account.type saat editing
  useEffect(() => {
    if (account?.type && account.type !== selectedType) {
      setSelectedType(account.type);
      console.log("Updating selectedType to:", account.type);
    }
  }, [account?.type, selectedType]);
  
  const [stock, setStock] = useState<number>(account?.stock || 1);
  const [duration, setDuration] = useState<string>(account?.duration?.toString() || '1');
  const [description, setDescription] = useState<string>(
    account?.description || 
    `Akun ${selectedType === 'NETFLIX' ? 'Netflix' : 'Spotify'} Premium ${duration} bulan. Bebas iklan, kualitas tinggi, garansi penuh selama masa berlaku.`
  );
  
  // Ubah struktur accounts untuk menyimpan profil untuk setiap akun
  const [accounts, setAccounts] = useState<Account[]>(() => {
    // Log untuk debugging inisialisasi accounts
    console.log("Initializing accounts state with:", {
      hasAccountProp: !!account,
      accountType: account?.type,
      hasProfiles: account?.profiles && account.profiles.length > 0,
      profileCount: account?.profiles?.length,
      profiles: account?.profiles
    });

    return [{
      accountEmail: account?.accountEmail || '',
      accountPassword: account?.accountPassword || '',
      profiles: account?.type === 'NETFLIX'
        ? (account.profiles && account.profiles.length > 0)
          ? account.profiles.map(p => ({
              id: p.id,
              name: p.name,
              pin: p.pin || '',
              isKids: p.isKids,
              inUse: p.orderId !== null || p.userId !== null
            }))
          : [
              { name: 'Profil 1', pin: '', isKids: false },
              { name: 'Profil 2', pin: '', isKids: false },
              { name: 'Profil 3', pin: '', isKids: false },
              { name: 'Profil 4', pin: '', isKids: false },
              { name: 'Profil 5', pin: '', isKids: true },
            ]
        : undefined
    }];
  });
  
  const isEditing = !!account;

  // Update accounts array when stock changes
  useEffect(() => {
    if (isEditing) return; // Don't auto-generate fields when editing

    // If stock increased, add more empty account fields
    if (accounts.length < stock) {
      const newAccounts = [...accounts];
      for (let i = accounts.length; i < stock; i++) {
        newAccounts.push({ 
          accountEmail: '', 
          accountPassword: '',
          // Untuk setiap akun baru, tambahkan 5 profil default jika tipe Netflix
          profiles: selectedType === 'NETFLIX' ? [
            { name: `Akun ${i+1} - Profil 1`, pin: '', isKids: false },
            { name: `Akun ${i+1} - Profil 2`, pin: '', isKids: false },
            { name: `Akun ${i+1} - Profil 3`, pin: '', isKids: false },
            { name: `Akun ${i+1} - Profil 4`, pin: '', isKids: false },
            { name: `Akun ${i+1} - Profil 5`, pin: '', isKids: true },
          ] : undefined 
        });
      }
      setAccounts(newAccounts);
    } 
    // If stock decreased, remove excess account fields
    else if (accounts.length > stock && stock > 0) {
      setAccounts(accounts.slice(0, stock));
    }
  }, [stock, isEditing, accounts.length, selectedType]);
  
  // Tambahkan effect untuk update profiles ketika tipe berubah
  useEffect(() => {
    if (isEditing) return;
    
    const updatedAccounts = accounts.map(acc => ({
      ...acc,
      profiles: selectedType === 'NETFLIX' ? (
        acc.profiles || [
          { name: 'Profil 1', pin: '', isKids: false },
          { name: 'Profil 2', pin: '', isKids: false },
          { name: 'Profil 3', pin: '', isKids: false },
          { name: 'Profil 4', pin: '', isKids: false },
          { name: 'Profil 5', pin: '', isKids: true },
        ]
      ) : undefined
    }));
    
    setAccounts(updatedAccounts);
  }, [selectedType, isEditing]);
  
  // State untuk harga
  const [price, setPrice] = useState<number>(account?.price || (selectedType === 'NETFLIX' ? 45000 : 35000));
  
  // Tambahkan state untuk Family Plan
  const [isFamilyPlan, setIsFamilyPlan] = useState<boolean>(account?.isFamilyPlan || false);
  const [maxSlots, setMaxSlots] = useState<number>(account?.maxSlots || 6);
  
  // State untuk Spotify Slots
  const [spotifySlots, setSpotifySlots] = useState<SpotifySlot[]>(() => {
    if (account?.type === 'SPOTIFY') {
      // Always treat Spotify accounts as family plans
      return [
        {
          slotName: 'Head Account',
          isActive: true,
          isAllocated: account?.isFamilyPlan ? true : false,
          isMainAccount: true,
          email: account?.accountEmail,
          password: account?.accountPassword
        }
      ];
    } else {
      // Default slot for new account - use empty values or account credentials if available
      return [
        {
          slotName: 'Head Account',
          isActive: true,
          isAllocated: false,
          isMainAccount: true,
          email: '', // Will be filled with account's email during creation
          password: '' // Will be filled with account's password during creation
        }
      ];
    }
  });

  // Fetch Spotify slots jika sedang edit akun
  useEffect(() => {
    if (isEditing && account?.type === 'SPOTIFY' && account.id) {
      // Di sini harusnya fetch data slot dari API
      console.log('Should fetch Spotify slots for account', account.id);
      // Contoh data dummy untuk sementara:
      setSpotifySlots([
        {
          id: 'dummy-id-1',
          slotName: 'Head Account',
          email: account.accountEmail,
          password: account.accountPassword,
          isActive: true,
          isAllocated: true,
          isMainAccount: true
        }
      ]);
    }
  }, [isEditing, account?.id, account?.type, account?.accountEmail, account?.accountPassword]);

  // Effect untuk membuat slot default saat family plan diaktifkan
  useEffect(() => {
    if (selectedType === 'SPOTIFY' && spotifySlots.length === 0) {
      setIsFamilyPlan(true); // Always set family plan to true for Spotify
      setSpotifySlots([
        {
          slotName: 'Head Account',
          isActive: true,
          isAllocated: false,
          isMainAccount: true
        }
      ]);
    }
  }, [selectedType, spotifySlots.length]);

  // Update effect when selectedType changes
  useEffect(() => {
    if (selectedType === 'SPOTIFY') {
      setIsFamilyPlan(true); // Always enable family plan for Spotify
    }
  }, [selectedType]);

  // Fungsi untuk mengatur harga default berdasarkan tipe dan durasi
  const setDefaultPrice = () => {
    const durationNum = parseInt(duration);
    if (selectedType === 'NETFLIX') {
      if (durationNum === 1) setPrice(45000);
      else if (durationNum === 2) setPrice(85000);
      else if (durationNum === 3) setPrice(125000);
      else if (durationNum === 6) setPrice(235000);
    } else {
      // SPOTIFY
      if (durationNum === 1) setPrice(35000);
      else if (durationNum === 2) setPrice(65000);
      else if (durationNum === 3) setPrice(95000);
      else if (durationNum === 6) setPrice(175000);
    }
  };
  
  // Update harga default saat tipe atau durasi berubah
  useEffect(() => {
    if (!isEditing) {
      setDefaultPrice();
    }
  }, [selectedType, duration, isEditing]);
  
  // Update effect untuk update default description ketika tipe atau durasi berubah
  useEffect(() => {
    if (!isEditing) {
      const durationNum = parseInt(duration);
      setDefaultPrice();
      const familyText = selectedType === 'SPOTIFY' && isFamilyPlan ? ` Family Plan (${maxSlots} slot)` : '';
      setDescription(`Akun ${selectedType === 'NETFLIX' ? 'Netflix' : 'Spotify'}${familyText} Premium ${duration} bulan. Bebas iklan, kualitas tinggi, garansi penuh selama masa berlaku.`);
    }
  }, [selectedType, duration, isFamilyPlan, maxSlots, isEditing]);
  
  // Tambahkan fungsi untuk mengupdate profil per akun
  const updateProfile = (accountIndex: number, profileIndex: number, field: keyof NetflixProfile, value: string | boolean) => {
    const newAccounts = [...accounts];
    if (newAccounts[accountIndex].profiles && newAccounts[accountIndex].profiles![profileIndex]) {
      newAccounts[accountIndex].profiles![profileIndex] = { 
        ...newAccounts[accountIndex].profiles![profileIndex], 
        [field]: value 
      };
      setAccounts(newAccounts);
    }
  };
  
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // Fungsi untuk menambah slot baru
  const addSpotifySlot = () => {
    if (spotifySlots.length < maxSlots) {
      setSpotifySlots([
        ...spotifySlots,
        {
          slotName: `Slot ${spotifySlots.length + 1}`,
          isActive: true,
          isAllocated: false,
          isMainAccount: false
        }
      ]);
    }
  };

  // Fungsi untuk menghapus slot
  const removeSpotifySlot = (index: number) => {
    if (!spotifySlots[index].isAllocated) {
      const newSlots = [...spotifySlots];
      newSlots.splice(index, 1);
      setSpotifySlots(newSlots);
    }
  };

  // Fungsi untuk mengubah slot menjadi main account
  const setSpotifySlotAsMain = (index: number) => {
    const newSlots = spotifySlots.map((slot, i) => ({
      ...slot,
      isMainAccount: i === index
    }));
    setSpotifySlots(newSlots);
  };

  // Fungsi untuk mengupdate data slot
  const updateSpotifySlot = (index: number, field: keyof SpotifySlot, value: any) => {
    const newSlots = [...spotifySlots];
    newSlots[index] = {
      ...newSlots[index],
      [field]: value
    };
    setSpotifySlots(newSlots);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      
      // Add duration to form data explicitly
      formData.set('duration', duration);
      
      // Add Spotify Family Plan data if relevant
      if (selectedType === 'SPOTIFY') {
        formData.set('isFamilyPlan', isFamilyPlan.toString());
        if (isFamilyPlan) {
          formData.set('maxSlots', maxSlots.toString());
          
          // Tambahkan data slot ke form data
          spotifySlots.forEach((slot, index) => {
            if (slot.id) {
              formData.append(`spotifySlots[${index}][id]`, slot.id);
            }
            formData.append(`spotifySlots[${index}][slotName]`, slot.slotName);
            formData.append(`spotifySlots[${index}][isMainAccount]`, slot.isMainAccount.toString());
            formData.append(`spotifySlots[${index}][isActive]`, slot.isActive.toString());
            if (slot.email) formData.append(`spotifySlots[${index}][email]`, slot.email);
            if (slot.password) formData.append(`spotifySlots[${index}][password]`, slot.password);
          });
        }
      }
      
      // For multiple accounts, we need to handle them specially
      if (!isEditing && accounts.length > 1) {
        // Remove the default account fields that will be empty
        formData.delete('accountEmail');
        formData.delete('accountPassword');
        
        // Add all accounts to formData with indexed names
        accounts.forEach((account, index) => {
          formData.append(`accounts[${index}][accountEmail]`, account.accountEmail);
          formData.append(`accounts[${index}][accountPassword]`, account.accountPassword);
          
          // Tambahkan profiles untuk akun Netflix
          if (selectedType === 'NETFLIX' && account.profiles) {
            account.profiles.forEach((profile, profileIndex) => {
              formData.append(`accounts[${index}][profiles][${profileIndex}][name]`, profile.name);
              formData.append(`accounts[${index}][profiles][${profileIndex}][pin]`, profile.pin);
              formData.append(`accounts[${index}][profiles][${profileIndex}][isKids]`, profile.isKids.toString());
            });
          }
        });
        
        // Add stock count
        formData.append('stock', stock.toString());
      } else if (selectedType === 'NETFLIX' && accounts[0].profiles) {
        // Untuk mode editing atau single account, tambahkan profiles langsung
        accounts[0].profiles.forEach((profile, profileIndex) => {
          if (profile.id) {
            // Jika profile sudah ada (punya id), tambahkan id untuk update di database
            formData.append(`profiles[${profileIndex}][id]`, profile.id);
          }
          formData.append(`profiles[${profileIndex}][name]`, profile.name);
          formData.append(`profiles[${profileIndex}][pin]`, profile.pin);
          formData.append(`profiles[${profileIndex}][isKids]`, profile.isKids.toString());
        });
      }
      
      // Cek perubahan status akun (isActive) 
      if (isEditing && account) {
        const currentIsActive = account.isActive || false;
        const newIsActive = formData.get('isActive') === 'on';
        
        if (currentIsActive !== newIsActive) {
          console.log('Status akun berubah dari', currentIsActive, 'menjadi', newIsActive);
          // Simpan status perubahan untuk notifikasi halaman client
          localStorage.setItem('adminAccountStatusChanged', Date.now().toString());
        }
      }
      
      // Simpan timestamp terakhir update di localStorage untuk sync
      localStorage.setItem('adminDataUpdated', Date.now().toString());
      
      try {
        // Proses biasa tanpa SpotifyFamilyForm
        await onSubmit(formData);
      } catch (error) {
        console.error('Error submitting form:', error);
        toast.error('Terjadi kesalahan saat menyimpan akun');
      }
    }
  };
  
  const updateAccount = (index: number, field: keyof Account, value: string) => {
    const newAccounts = [...accounts];
    newAccounts[index] = { ...newAccounts[index], [field]: value };
    setAccounts(newAccounts);
  };
  
  const addAccount = () => {
    setAccounts([...accounts, { 
      accountEmail: '', 
      accountPassword: '',
      // Tambahkan profiles default jika tipe Netflix
      profiles: selectedType === 'NETFLIX' ? [
        { name: `Akun ${accounts.length + 1} - Profil 1`, pin: '', isKids: false },
        { name: `Akun ${accounts.length + 1} - Profil 2`, pin: '', isKids: false },
        { name: `Akun ${accounts.length + 1} - Profil 3`, pin: '', isKids: false },
        { name: `Akun ${accounts.length + 1} - Profil 4`, pin: '', isKids: false },
        { name: `Akun ${accounts.length + 1} - Profil 5`, pin: '', isKids: true },
      ] : undefined
    }]);
    setStock(prev => prev + 1);
  };
  
  const removeAccount = (index: number) => {
    if (accounts.length > 1) {
      const newAccounts = [...accounts];
      newAccounts.splice(index, 1);
      setAccounts(newAccounts);
      setStock(prev => prev - 1);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const lines = content.split('\n').filter(line => line.trim());
        
        const importedAccounts: Account[] = [];
        lines.forEach((line, index) => {
          const [email, password] = line.split(',').map(item => item.trim());
          if (email && password) {
            importedAccounts.push({ 
              accountEmail: email, 
              accountPassword: password,
              // Tambahkan profiles default jika tipe Netflix
              profiles: selectedType === 'NETFLIX' ? [
                { name: `Akun ${index + 1} - Profil 1`, pin: '', isKids: false },
                { name: `Akun ${index + 1} - Profil 2`, pin: '', isKids: false },
                { name: `Akun ${index + 1} - Profil 3`, pin: '', isKids: false },
                { name: `Akun ${index + 1} - Profil 4`, pin: '', isKids: false },
                { name: `Akun ${index + 1} - Profil 5`, pin: '', isKids: true },
              ] : undefined
            });
          }
        });
        
        if (importedAccounts.length > 0) {
          setAccounts(importedAccounts);
          setStock(importedAccounts.length);
        }
      } catch (error) {
        console.error('Error parsing imported file:', error);
        alert('Format file tidak valid. Gunakan format CSV dengan email dan password dipisahkan koma.');
      }
    };
    reader.readAsText(file);
  };
  
  // Tambahkan fungsi untuk menambahkan profil baru
  const addNewProfile = () => {
    if (!accounts[0].profiles) {
      const newAccounts = [...accounts];
      newAccounts[0].profiles = [];
      setAccounts(newAccounts);
    }
    
    if (accounts[0].profiles && accounts[0].profiles.length < 5) {
      const newProfiles = [...accounts[0].profiles];
      newProfiles.push({
        name: `Profil ${newProfiles.length + 1}`,
        pin: '',
        isKids: false
      });
      
      const newAccounts = [...accounts];
      newAccounts[0] = { ...newAccounts[0], profiles: newProfiles };
      setAccounts(newAccounts);
    } else {
      toast.error('Maksimal 5 profil per akun Netflix', {
        duration: 3000
      });
    }
  };

  // Tambahkan fungsi untuk menghapus profil
  const removeProfile = (profileIndex: number) => {
    if (accounts[0].profiles && accounts[0].profiles.length > 0) {
      // Cek apakah profil sedang digunakan
      if (accounts[0].profiles[profileIndex].inUse) {
        toast.error('Tidak dapat menghapus profil yang sedang digunakan oleh pengguna.', {
          duration: 3000,
          icon: '⚠️'
        });
        return;
      }
      
      // Konfirmasi penghapusan
      if (window.confirm(`Apakah Anda yakin ingin menghapus profil "${accounts[0].profiles[profileIndex].name}"?`)) {
        const newProfiles = [...accounts[0].profiles];
        newProfiles.splice(profileIndex, 1);
        
        const newAccounts = [...accounts];
        newAccounts[0] = { ...newAccounts[0], profiles: newProfiles };
        setAccounts(newAccounts);
        
        toast.success('Profil berhasil dihapus.', {
          duration: 2000,
          icon: '🗑️'
        });
      }
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tipe Akun
          </label>
          <select
            name="type"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="NETFLIX">Netflix</option>
            <option value="SPOTIFY">Spotify</option>
          </select>
        </div>

        {/* Duration selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Masa Berlaku
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 6].map((months) => (
              <button
                key={months}
                type="button"
                className={`px-3 py-2 border rounded-md ${
                  duration === months.toString()
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => {
                  setDuration(months.toString());
                  setDefaultPrice();
                }}
              >
                {months} Bulan
              </button>
            ))}
          </div>
          <input type="hidden" name="duration" value={duration} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email Akun
          </label>
          <input
            type="email"
            name="accountEmail"
            defaultValue={account?.accountEmail || ''}
            onChange={(e) => {
              // Update email pada slot Spotify jika tipe akun adalah Spotify
              if (selectedType === 'SPOTIFY' && !isEditing && spotifySlots.length > 0) {
                const updatedSlots = [...spotifySlots];
                updatedSlots[0] = { ...updatedSlots[0], email: e.target.value };
                setSpotifySlots(updatedSlots);
              }
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Password Akun
          </label>
          <input
            type="text"
            name="accountPassword"
            defaultValue={account?.accountPassword || ''}
            onChange={(e) => {
              // Update password pada slot Spotify jika tipe akun adalah Spotify
              if (selectedType === 'SPOTIFY' && !isEditing && spotifySlots.length > 0) {
                const updatedSlots = [...spotifySlots];
                updatedSlots[0] = { ...updatedSlots[0], password: e.target.value };
                setSpotifySlots(updatedSlots);
              }
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Harga
          </label>
          <input
            type="number"
            name="price"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
          <div className="mt-1 text-xs text-gray-500 flex">
            <button 
              type="button" 
              onClick={setDefaultPrice}
              className="text-indigo-600 underline"
            >
              Set harga default
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Deskripsi
          </label>
          <textarea
            name="description"
            defaultValue={account?.description || `Akun ${selectedType} Premium ${duration} bulan. Bebas iklan, kualitas tinggi, garansi penuh selama masa berlaku.`}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Garansi (dalam hari)
          </label>
          <input
            type="number"
            name="warranty"
            defaultValue={account?.warranty || 30}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            defaultChecked={account?.isActive !== false}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
            Akun Aktif
          </label>
        </div>

        {/* Spotify Family Plan Section */}
        {selectedType === 'SPOTIFY' && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">Spotify Family Plan</h3>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              {/* Family plan is always enabled for Spotify, so no checkbox needed */}
              <input type="hidden" name="isFamilyPlan" value="true" />
              
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jumlah Slot (Max 6)
                  </label>
                  <div className="grid grid-cols-6 gap-2 mb-3">
                    {[1, 2, 3, 4, 5, 6].map((slots) => (
                      <button
                        key={slots}
                        type="button"
                        className={`px-3 py-2 border rounded-md ${
                          maxSlots === slots
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => setMaxSlots(slots)}
                      >
                        {slots}
                      </button>
                    ))}
                  </div>
                  <input type="hidden" name="maxSlots" value={maxSlots} />
                </div>
                
                {/* Spotify Slots Management */}
                {isEditing ? (
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-medium text-gray-700">Kelola Slot Akun</h4>
                      <button
                        type="button"
                        onClick={() => addSpotifySlot()}
                        disabled={spotifySlots.length >= maxSlots}
                        className="inline-flex items-center px-2 py-1 border border-green-300 text-xs font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiPlus className="h-3 w-3 mr-1" /> Tambah Slot
                      </button>
                    </div>
                    
                    {spotifySlots.length > 0 ? (
                      <div className="space-y-3">
                        {spotifySlots.map((slot, index) => (
                          <div key={index} className="p-3 bg-white rounded border border-gray-200">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 ${
                                  slot.isMainAccount ? 'bg-green-500' : 'bg-blue-500'
                                }`}>
                                  {index + 1}
                                </span>
                                <span className="text-sm font-medium">{slot.isMainAccount ? 'Head Account' : 'Member'}</span>
                                {slot.isAllocated && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                    <FiCheckCircle className="mr-1 h-3 w-3" /> Terpakai
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                {!slot.isAllocated && !slot.isMainAccount && (
                                  <button
                                    type="button"
                                    onClick={() => removeSpotifySlot(index)}
                                    className="text-red-600 hover:text-red-800 p-1 rounded-full"
                                  >
                                    <FiTrash className="h-3 w-3" />
                                  </button>
                                )}
                                {!slot.isMainAccount && (
                                  <button
                                    type="button"
                                    onClick={() => setSpotifySlotAsMain(index)}
                                    className="text-green-600 hover:text-green-800 p-1 rounded-full"
                                    title="Jadikan Head Account"
                                  >
                                    <FiCheckCircle className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Nama Slot</label>
                                <input
                                  type="text"
                                  value={slot.slotName}
                                  onChange={(e) => updateSpotifySlot(index, 'slotName', e.target.value)}
                                  className="block w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm"
                                  placeholder="Masukkan nama slot"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Email (opsional)</label>
                                <input
                                  type="email"
                                  value={slot.email || ''}
                                  onChange={(e) => updateSpotifySlot(index, 'email', e.target.value)}
                                  className="block w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm"
                                  placeholder="Email jika sudah diisi"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-3 bg-gray-50 border border-gray-200 rounded-md">
                        <p className="text-sm text-gray-500">Belum ada slot yang dibuat</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4">
                    <div className="text-sm text-gray-700 mb-2">
                      <div className="flex items-center text-sm text-gray-700 mb-2">
                        <FiMusic className="h-4 w-4 mr-2 text-green-600" />
                        Informasi Family Plan:
                      </div>
                      <ul className="list-disc pl-10 text-sm text-gray-600 space-y-1">
                        <li>Spotify Family Plan memungkinkan hingga 6 akun Premium dalam satu paket</li>
                        <li>Setiap anggota memiliki akun terpisah dengan playlist dan rekomendasi sendiri</li>
                        <li>Semua anggota harus tinggal di alamat yang sama</li>
                        <li>Slot pertama otomatis menjadi Head Account</li>
                        <li>Head Account memiliki kendali untuk menambah/menghapus anggota</li>
                        <li>Anda dapat menjual setiap slot secara terpisah</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Netflix Profiles Section */}
        {selectedType === 'NETFLIX' && isEditing && accounts[0].profiles && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">Profil Netflix</h3>
              {accounts[0].profiles.length < 5 && (
                <button
                  type="button"
                  onClick={addNewProfile}
                  className="inline-flex items-center px-3 py-2 border border-indigo-300 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                >
                  <FiPlus className="h-4 w-4 mr-1" /> Tambah Profil
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {accounts[0].profiles.map((profile, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                      <span className={`w-8 h-8 rounded-md flex items-center justify-center text-white text-sm font-bold mr-3 ${
                        profile.isKids ? 'bg-green-500' : 'bg-red-600'
                      }`}>
                        {index + 1}
                      </span>
                      <h6 className="text-sm font-medium">{profile.isKids ? 'Profil Anak' : 'Profil Reguler'}</h6>
                      {profile.inUse && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          <FiCheckCircle className="mr-1 h-3 w-3" /> Digunakan
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!profile.inUse && (
                        <button
                          type="button"
                          onClick={() => removeProfile(index)}
                          className="text-red-600 hover:text-red-800 px-2 py-1 text-xs rounded-full border border-red-200 bg-red-50 flex items-center"
                        >
                          <FiTrash className="h-3 w-3 mr-1" />
                          Hapus
                        </button>
                      )}
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={profile.isKids}
                          onChange={e => updateProfile(0, index, 'isKids', e.target.checked)}
                          className="mr-1.5 h-4 w-4 text-indigo-600"
                        />
                        <span className="text-xs text-gray-600">Profil Anak</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">
                        Nama Profil
                      </label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => updateProfile(0, index, 'name', e.target.value)}
                        placeholder="Nama Profil"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      {profile.id && <input type="hidden" name={`profiles[${index}][id]`} value={profile.id} />}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">
                        PIN (Opsional)
                      </label>
                      <input
                        type="text"
                        value={profile.pin}
                        onChange={(e) => updateProfile(0, index, 'pin', e.target.value)}
                        placeholder="PIN 4 digit (opsional)"
                        maxLength={4}
                        pattern="[0-9]*"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Netflix Profiles Section for Creation */}
        {selectedType === 'NETFLIX' && !isEditing && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">Profil Netflix</h3>
              <div className="text-sm text-gray-500">5 profil standar akan dibuat otomatis</div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <div className="flex items-center text-sm text-gray-700 mb-2">
                <FiPlay className="h-4 w-4 mr-2 text-red-600" />
                Profil Netflix akan dibuat secara otomatis dengan pengaturan default:
              </div>
              <ul className="list-disc pl-10 text-sm text-gray-600 space-y-1">
                <li>4 Profil reguler</li>
                <li>1 Profil khusus anak</li>
                <li>Profil dapat diedit setelah akun dibuat</li>
              </ul>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            <FiSave className="mr-2 h-4 w-4" />
            {account ? 'Simpan Perubahan' : 'Simpan Akun'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default AccountForm; 