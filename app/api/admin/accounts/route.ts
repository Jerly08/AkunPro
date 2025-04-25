import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { accounts_type } from '@prisma/client';
import { SpotifyService } from '@/lib/spotify-service';

// GET - Mengambil semua akun
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const accounts = await prisma.account.findMany({
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error getting accounts:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST - Menambah akun baru
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse form data
    const formData = await request.formData();
    
    // Extract required fields
    const type = formData.get('type') as string;
    const accountEmail = formData.get('accountEmail') as string;
    const accountPassword = formData.get('accountPassword') as string;
    
    // Validasi input
    if (!type || !accountEmail || !accountPassword) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Tambahkan parsing untuk isFamilyPlan dan maxSlots
    const isFamilyPlan = formData.get('isFamilyPlan') === 'true';
    const maxSlots = formData.get('maxSlots') ? parseInt(formData.get('maxSlots') as string) : undefined;
    
    // Buat akun baru dengan sellerId dari admin yang sedang login
    const account = await prisma.account.create({
      data: {
        type: type as accounts_type,
        accountEmail,
        accountPassword,
        price: parseFloat(formData.get('price') as string),
        description: formData.get('description') as string,
        warranty: parseInt(formData.get('warranty') as string),
        isActive: formData.has('isActive'),
        duration: parseInt(formData.get('duration') as string) || 1,
        sellerId: session.user.id,
        stock: parseInt(formData.get('stock') as string) || 1,
        // Tambahkan data untuk Family Plan jika tipe akun Spotify
        ...(type === 'SPOTIFY' ? {
          isFamilyPlan,
          maxSlots: isFamilyPlan ? (maxSlots || 6) : 1
        } : {})
      },
      include: {
        seller: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
    
    // Jika akun Netflix, tambahkan juga profil Netflix
    if (type === 'NETFLIX') {
      // Cek apakah ada data profil di form
      const hasProfiles = Array.from(formData.keys()).some(key => key.startsWith('profiles['));
      
      if (hasProfiles) {
        // Ekstrak data profil
        const profilesData: any[] = [];
        const profilesMap = new Map<number, { name: string, pin: string, isKids: boolean }>();
        
        Array.from(formData.entries()).forEach(([key, value]) => {
          if (key.startsWith('profiles[')) {
            // Format: profiles[0][name] atau profiles[0][pin] atau profiles[0][isKids]
            const matches = key.match(/profiles\[(\d+)\]\[(\w+)\]/);
            if (matches && matches.length === 3) {
              const index = parseInt(matches[1]);
              const field = matches[2];
              
              if (!profilesMap.has(index)) {
                profilesMap.set(index, { name: '', pin: '', isKids: false });
              }
              
              const profile = profilesMap.get(index)!;
              if (field === 'name') {
                profile.name = value as string;
              } else if (field === 'pin') {
                profile.pin = value as string;
              } else if (field === 'isKids') {
                profile.isKids = value === 'true';
              }
            }
          }
        });
        
        // Buat array profil untuk bulk create
        profilesMap.forEach((profile) => {
          profilesData.push({
            accountId: account.id,
            name: profile.name,
            pin: profile.pin || null,
            isKids: profile.isKids,
          });
        });
        
        // Buat profil Netflix
        if (profilesData.length > 0) {
          await prisma.netflixProfile.createMany({
            data: profilesData,
          });
        }
      } else {
        // Jika tidak ada data profil, buat 5 profil default
        const defaultProfiles = [
          { name: 'Profil 1', pin: null, isKids: false },
          { name: 'Profil 2', pin: null, isKids: false },
          { name: 'Profil 3', pin: null, isKids: false },
          { name: 'Profil 4', pin: null, isKids: false },
          { name: 'Profil 5', pin: null, isKids: true },
        ];
        
        await prisma.netflixProfile.createMany({
          data: defaultProfiles.map(p => ({
            ...p,
            accountId: account.id,
          })),
        });
      }
    }
    
    // Jika akun Spotify, selalu buat slot pertama dengan spotify1@gmail.com sebagai HEAD account
    if (type === 'SPOTIFY') {
      try {
        await SpotifyService.createDefaultSpotifySlot(account.id);
      } catch (error) {
        console.error('Error creating default Spotify slot:', error);
        // Continue with the process even if there's an error creating the default slot
      }
    
      // Jika ada data slot tambahan di form, buat slot tambahan
      const hasSlots = Array.from(formData.keys()).some(key => key.startsWith('spotifySlots['));
      
      if (hasSlots) {
        // Ekstrak data slot
        const slotsData: any[] = [];
        const slotsMap = new Map<number, { 
          slotName: string,
          email: string | null,
          password: string | null,
          isActive: boolean,
          isMainAccount: boolean
        }>();
        
        Array.from(formData.entries()).forEach(([key, value]) => {
          if (key.startsWith('spotifySlots[')) {
            // Format: spotifySlots[0][slotName] atau spotifySlots[0][email] dll
            const matches = key.match(/spotifySlots\[(\d+)\]\[(\w+)\]/);
            if (matches && matches.length === 3) {
              const index = parseInt(matches[1]);
              const field = matches[2];
              
              if (!slotsMap.has(index)) {
                slotsMap.set(index, { 
                  slotName: '',
                  email: null,
                  password: null,
                  isActive: true,
                  isMainAccount: false
                });
              }
              
              const slot = slotsMap.get(index)!;
              if (field === 'slotName') {
                slot.slotName = value as string;
              } else if (field === 'email') {
                slot.email = value as string;
              } else if (field === 'password') {
                slot.password = value as string;
              } else if (field === 'isActive') {
                slot.isActive = value === 'true';
              } else if (field === 'isMainAccount') {
                slot.isMainAccount = value === 'true';
              }
            }
          }
        });
        
        // Skip the first slot (index 0) as we've already created it
        // and create additional slots starting from index 1
        slotsMap.forEach((slot, index) => {
          if (index > 0) { // Skip the first slot as we've already created it with spotify1@gmail.com
            slotsData.push({
              accountId: account.id,
              slotName: slot.slotName,
              email: slot.email,
              password: slot.password,
              isActive: slot.isActive,
              isMainAccount: false, // All additional slots should not be main accounts
              isAllocated: false
            });
          }
        });
        
        // Buat Spotify slots
        if (slotsData.length > 0) {
          await prisma.spotifySlot.createMany({
            data: slotsData,
          });
        }
      }
    }
    
    return NextResponse.json(account);
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PUT - Mengupdate akun
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const id = params.id;
    if (!id) {
      return NextResponse.json(
        { message: 'Missing account ID' },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    
    // Extract required fields
    const type = formData.get('type') as string;
    const accountEmail = formData.get('accountEmail') as string;
    const accountPassword = formData.get('accountPassword') as string;
    
    // Validasi input
    if (!type || !accountEmail || !accountPassword) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Tambahkan parsing untuk isFamilyPlan dan maxSlots
    const isFamilyPlan = formData.get('isFamilyPlan') === 'true';
    const maxSlots = formData.get('maxSlots') ? parseInt(formData.get('maxSlots') as string) : undefined;
    
    // Update account in database
    const updatedAccount = await prisma.account.update({
      where: {
        id
      },
      data: {
        type: type as accounts_type,
        accountEmail,
        accountPassword,
        price: parseFloat(formData.get('price') as string),
        description: formData.get('description') as string,
        warranty: parseInt(formData.get('warranty') as string),
        isActive: formData.has('isActive'),
        duration: parseInt(formData.get('duration') as string) || 1,
        stock: parseInt(formData.get('stock') as string) || 1,
        // Tambahkan data untuk Family Plan jika tipe akun Spotify
        ...(type === 'SPOTIFY' ? {
          isFamilyPlan,
          maxSlots: isFamilyPlan ? (maxSlots || 6) : 1
        } : {})
      },
    });

    // Jika tipe akun Spotify dan family plan, update atau tambahkan slot
    if (type === 'SPOTIFY' && isFamilyPlan) {
      // Cek apakah ada data slot di form
      const hasSlots = Array.from(formData.keys()).some(key => key.startsWith('spotifySlots['));
      
      if (hasSlots) {
        // Ekstrak data slot
        const slotsData: any[] = [];
        const slotsMap = new Map<number, { 
          id?: string,
          slotName: string,
          email: string | null,
          password: string | null,
          isActive: boolean,
          isMainAccount: boolean
        }>();
        
        Array.from(formData.entries()).forEach(([key, value]) => {
          if (key.startsWith('spotifySlots[')) {
            // Format: spotifySlots[0][id] atau spotifySlots[0][slotName] dll
            const matches = key.match(/spotifySlots\[(\d+)\]\[(\w+)\]/);
            if (matches && matches.length === 3) {
              const index = parseInt(matches[1]);
              const field = matches[2];
              
              if (!slotsMap.has(index)) {
                slotsMap.set(index, { 
                  slotName: '',
                  email: null,
                  password: null,
                  isActive: true,
                  isMainAccount: false
                });
              }
              
              const slot = slotsMap.get(index)!;
              if (field === 'id') {
                slot.id = value as string;
              } else if (field === 'slotName') {
                slot.slotName = value as string;
              } else if (field === 'email') {
                slot.email = value as string;
              } else if (field === 'password') {
                slot.password = value as string;
              } else if (field === 'isActive') {
                slot.isActive = value === 'true';
              } else if (field === 'isMainAccount') {
                slot.isMainAccount = value === 'true';
              }
            }
          }
        });
        
        // Process each slot - update existing or create new
        for (const [_, slot] of slotsMap.entries()) {
          if (slot.id) {
            // Update existing slot
            await prisma.spotifySlot.update({
              where: { id: slot.id },
              data: {
                slotName: slot.slotName,
                email: slot.email,
                password: slot.password,
                isActive: slot.isActive,
                isMainAccount: slot.isMainAccount
              }
            });
          } else {
            // Create new slot
            await prisma.spotifySlot.create({
              data: {
                accountId: id,
                slotName: slot.slotName,
                email: slot.email,
                password: slot.password,
                isActive: slot.isActive,
                isMainAccount: slot.isMainAccount,
                isAllocated: false
              }
            });
          }
        }
        
        // Get current slots to find deleted ones
        const existingSlots = await prisma.spotifySlot.findMany({
          where: { accountId: id },
          select: { id: true, isAllocated: true }
        });
        
        // IDs of slots coming from the form
        const formSlotIds = new Set(
          Array.from(slotsMap.values())
            .filter(slot => slot.id)
            .map(slot => slot.id)
        );
        
        // Delete slots that are in DB but not in form data (except allocated ones)
        for (const slot of existingSlots) {
          if (!formSlotIds.has(slot.id) && !slot.isAllocated) {
            await prisma.spotifySlot.delete({
              where: { id: slot.id }
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Account updated successfully',
      account: updatedAccount
    });
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error', error: (error as Error).message },
      { status: 500 }
    );
  }
} 