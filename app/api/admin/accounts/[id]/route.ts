import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET - Mengambil detail akun berdasarkan ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Fix: await params first
  const params_obj = await params;
  const id = params_obj.id;
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const account = await prisma.account.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        orderItems: {
          select: {
            order: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
        profiles: true,
      },
    });

    if (!account) {
      return NextResponse.json(
        { message: 'Akun tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error getting account:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PATCH - Mengupdate akun berdasarkan ID
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Fix: await params first
  const params_obj = await params;
  const id = params_obj.id;
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Body dari request:', JSON.stringify(body, null, 2)); // Log body untuk debugging
    
    const { type, accountEmail, accountPassword, price, description, warranty, isActive, stock, duration, profiles } = body;

    // Update akun
    const account = await prisma.account.update({
      where: { id },
      data: {
        type,
        accountEmail: accountEmail ? accountEmail : undefined,
        accountPassword: accountPassword ? accountPassword : undefined,
        price: price !== undefined ? Number(price) : undefined,
        description: description ? description : undefined,
        warranty: warranty !== undefined ? Number(warranty) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        stock: stock !== undefined ? Number(stock) : undefined,
        duration: duration !== undefined ? Number(duration) : undefined,
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        profiles: true, // Sertakan profiles untuk dikembalikan dalam respons
      },
    });
    
    // Update Netflix profiles jika tipe NETFLIX dan profiles dikirimkan
    if (type === 'NETFLIX' && profiles && Array.isArray(profiles)) {
      console.log('Memproses profil Netflix:', JSON.stringify(profiles, null, 2)); // Log profil untuk debugging
      
      // Ambil semua profil yang ada dari database
      const existingProfiles = await prisma.netflixProfile.findMany({
        where: { accountId: id },
        select: { id: true, orderId: true, userId: true }
      });
      
      console.log('Profil yang ada di database:', JSON.stringify(existingProfiles, null, 2)); // Log profil untuk debugging
      
      // Identifikasi profil yang perlu dihapus (ada di DB tapi tidak ada di request)
      const profileIdsInRequest = profiles.filter(p => p.id && !p.id.startsWith('new-')).map(p => p.id);
      console.log('Profile IDs dalam request:', profileIdsInRequest); // Log untuk debugging
      
      const profilesToDelete = existingProfiles.filter(p => 
        !profileIdsInRequest.includes(p.id) && !p.orderId && !p.userId
      );
      
      console.log('Profil yang akan dihapus:', JSON.stringify(profilesToDelete, null, 2)); // Log untuk debugging
      
      // Hapus profil yang tidak digunakan dan tidak ada di request
      if (profilesToDelete.length > 0) {
        for (const profile of profilesToDelete) {
          try {
            console.log(`Menghapus profil dengan ID: ${profile.id}`);
            await prisma.netflixProfile.delete({
              where: { id: profile.id }
            });
          } catch (deleteError) {
            console.error(`Error saat menghapus profil ${profile.id}:`, deleteError);
            // Lanjutkan proses meskipun ada error
          }
        }
      }
      
      // Update atau buat profil yang dikirim
      for (const profile of profiles) {
        try {
          if (profile.id && !profile.id.startsWith('new-')) {
            // Update profil yang sudah ada
            console.log(`Update profil dengan ID: ${profile.id}`, profile);
            await prisma.netflixProfile.update({
              where: { id: profile.id },
              data: {
                name: profile.name,
                pin: profile.pin === '' ? null : profile.pin,
                isKids: Boolean(profile.isKids),
              }
            });
          } else {
            // Buat profil baru
            console.log('Membuat profil baru:', profile);
            const newProfile = await prisma.netflixProfile.create({
              data: {
                accountId: id,
                name: profile.name,
                pin: profile.pin === '' ? null : profile.pin,
                isKids: Boolean(profile.isKids),
              }
            });
            console.log('===== PROFILE CREATED SUCCESSFULLY =====');
            console.log('New Profile ID:', newProfile.id);
            console.log('Account ID:', id);
            console.log('Name:', newProfile.name);
            console.log('Pin:', newProfile.pin || 'None');
            console.log('Is Kids:', newProfile.isKids);
            console.log('Created At:', newProfile.createdAt);
            console.log('Order ID link:', newProfile.orderId || 'Not linked to order');
            console.log('User ID link:', newProfile.userId || 'Not linked to user');
            console.log('========================================');
          }
        } catch (profileError) {
          console.error('Error saat memproses profil:', profile, profileError);
          // Lanjutkan proses untuk profil lainnya
        }
      }
      
      // Ambil ulang akun dengan profil terbaru
      try {
        const updatedAccount = await prisma.account.findUnique({
          where: { id },
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            profiles: true,
          }
        });
        
        return NextResponse.json(updatedAccount);
      } catch (findError) {
        console.error('Error saat mengambil ulang data akun:', findError);
        return NextResponse.json(account); // Kembalikan akun tanpa profil jika gagal mengambil ulang
      }
    }

    return NextResponse.json(account);
  } catch (error: any) {
    console.error('Error updating account:', error);
    
    // Berikan detail error yang lebih spesifik
    let errorMessage = 'Internal Server Error';
    let statusCode = 500;
    
    if (error.code === 'P2025') {
      errorMessage = 'Akun tidak ditemukan';
      statusCode = 404;
    } else if (error.code === 'P2002') {
      errorMessage = 'Terdapat konflik dengan data yang sudah ada';
      statusCode = 409;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { message: errorMessage, error: `${error}` },
      { status: statusCode }
    );
  }
}

// DELETE - Menghapus akun berdasarkan ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Fix: await params first
  const params_obj = await params;
  const id = params_obj.id;
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden. Only admin can delete accounts.' },
        { status: 403 }
      );
    }

    // Cek jika akun ada sebelum menghapus
    const accountExists = await prisma.account.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!accountExists) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    try {
      // Hapus netflixProfiles terlebih dahulu
      await prisma.netflixProfile.deleteMany({
        where: { accountId: id },
      });
      
      // Hapus orderItems jika ada
      await prisma.orderItem.deleteMany({
        where: { accountId: id },
      });
      
      // Hapus account
      const deletedAccount = await prisma.account.delete({
        where: { id },
      });
      
      return NextResponse.json({ success: true, deletedAccount });
    } catch (deleteError: any) {
      console.error('Error during delete operation:', deleteError);
      
      // Handling untuk foreign key constraint
      if (deleteError.code === 'P2003') {
        return NextResponse.json(
          { error: 'Akun tidak dapat dihapus karena masih digunakan oleh data lain' },
          { status: 400 }
        );
      }
      
      throw deleteError;
    }
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 