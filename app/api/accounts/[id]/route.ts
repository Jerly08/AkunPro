import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const params_obj = await params;
  
  try {
    // Periksa autentikasi
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Dapatkan ID dari URL path alih-alih params
    const pathname = request.nextUrl.pathname;
    const segments = pathname.split('/');
    const accountId = segments[segments.length - 1];
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }
    
    // Cek jika pengguna adalah pemilik akun (melalui OrderItem)
    const orderItems = await prisma.orderItem.findMany({
      where: {
        accountId: accountId,
        order: {
          userId: session.user.id,
          status: 'COMPLETED',
        },
      },
      include: {
        order: {
          select: {
            id: true,
            customerName: true,
            userId: true,
            status: true,
          },
        },
      },
    });
    
    // Jika pengguna bukan pemilik akun dan bukan admin, tolak akses
    if (orderItems.length === 0 && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You do not have permission to view this account' },
        { status: 403 }
      );
    }
    
    // Tentukan apakah pengguna adalah admin
    const isAdmin = session.user.role === 'ADMIN';
    
    // Buat select options dinamis untuk account
    const selectOptions: Prisma.AccountSelect = {
      id: true,
      type: true,
      accountEmail: true,
      accountPassword: true,
      price: true,
      description: true,
      warranty: true,
      isActive: true,
      createdAt: true,
      duration: true,
      stock: true,
      profiles: isAdmin 
        ? { // Admin dapat melihat semua profil
            select: {
              id: true,
              name: true,
              pin: true,
              isKids: true,
              userId: true,
              orderId: true
            }
          }
        : { // Pengguna biasa dapat melihat profil yang dialokasikan atau profil yang terkait dengan pesanan mereka
            where: {
              OR: [
                { userId: session.user.id },
                {
                  orderId: {
                    in: orderItems.map(item => item.id)
                  }
                }
              ]
            },
            select: {
              id: true,
              name: true,
              pin: true,
              isKids: true
            }
          },
      orderItems: {
        select: {
          id: true,
          orderId: true,
          accountId: true,
          netflixProfile: {
            select: {
              id: true,
              name: true,
              pin: true,
              isKids: true,
              userId: true,
              orderId: true,
              account: {
                select: {
                  id: true,
                  type: true
                }
              }
            }
          },
          order: {
            select: {
              id: true,
              customerName: true,
              userId: true,
              status: true,
            },
          },
        },
      },
    };
    
    // Ambil detail akun
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: selectOptions,
    });
    
    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }
    
    // Log untuk debugging NetflixProfile
    console.log('===== DEBUG NETFLIX PROFILE =====');
    console.log(`Account ID: ${account.id}, Type: ${account.type}`);
    console.log(`Total OrderItems: ${account.orderItems.length}`);
    console.log(`OrderItems with NetflixProfile: ${account.orderItems.filter(item => item.netflixProfile).length}`);
    
    if (account.orderItems.length > 0) {
      account.orderItems.forEach((item: any, index) => {
        console.log(`OrderItem ${index + 1} (ID: ${item.id.substring(0, 8)}...)`);
        console.log(`  Order ID: ${item.orderId.substring(0, 8)}...`);
        if (item.netflixProfile) {
          console.log(`  Has NetflixProfile: YES`);
          console.log(`  Profile Name: ${item.netflixProfile.name}`);
          console.log(`  Profile ID: ${item.netflixProfile.id.substring(0, 8)}...`);
          console.log(`  Profile User ID: ${item.netflixProfile.userId || 'Not assigned'}`);
        } else {
          console.log(`  Has NetflixProfile: NO`);
        }
      });
    }
    
    if (account.profiles) {
      console.log(`Total Profiles: ${account.profiles.length}`);
      account.profiles.forEach((profile, index) => {
        console.log(`Profile ${index + 1} (ID: ${profile.id.substring(0, 8)}...)`);
        console.log(`  Name: ${profile.name}`);
        console.log(`  User ID: ${profile.userId || 'Not assigned'}`);
        console.log(`  Order ID: ${profile.orderId || 'Not assigned'}`);
      });
    } else {
      console.log('No profiles found for this account');
    }
    console.log('=================================');
    
    // Demi debug, cek di database seperti apa relasi sebenarnya
    // Ini untuk memastikan seluruh data diambil dengan benar
    try {
      // Log data netflixProfile dari database langsung
      console.log("DIRECT DB CHECK ===================");
      
      // Cek profil yang terkait dengan account ini
      const accountProfiles = await prisma.netflixProfile.findMany({
        where: { accountId: account.id },
        include: {
          orderItem: true,
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      
      console.log(`Direct DB: Account has ${accountProfiles.length} Netflix profiles`);
      accountProfiles.forEach((profile, i) => {
        console.log(`Profile ${i+1}: ${profile.name} (${profile.id.substring(0, 8)}...)`);
        console.log(`  User ID: ${profile.userId || 'Not assigned'}`);
        console.log(`  Order ID: ${profile.orderId || 'Not assigned'}`);
        console.log(`  OrderItem connected: ${profile.orderItem ? 'YES' : 'NO'}`);
      });
      
      // Cek orderItems yang terkait dengan akun ini
      const accountOrderItems = await prisma.orderItem.findMany({
        where: { accountId: account.id },
        include: {
          netflixProfile: true,
          order: {
            select: {
              userId: true,
              status: true
            }
          }
        }
      });
      
      console.log(`Direct DB: Account has ${accountOrderItems.length} OrderItems`);
      accountOrderItems.forEach((item: any, i) => {
        console.log(`OrderItem ${i+1}: ${item.id.substring(0, 8)}...`);
        console.log(`  Order User ID: ${item.order.userId}`);
        console.log(`  Order Status: ${item.order.status}`);
        console.log(`  NetflixProfile: ${item.netflixProfile ? item.netflixProfile.name : 'NONE'}`);
      });
      
      console.log("END DIRECT DB CHECK ==============");
    } catch (dbCheckError) {
      console.error("Error checking direct database relations:", dbCheckError);
    }
    
    return NextResponse.json(account);
  } catch (error) {
    console.error('Error fetching account details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const params_obj = await params;
  
  try {
    // Periksa autentikasi
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Dapatkan ID dari URL path alih-alih params
    const pathname = request.nextUrl.pathname;
    const segments = pathname.split('/');
    const accountId = segments[segments.length - 1];
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }
    
    // Cek jika pengguna adalah pemilik akun (melalui OrderItem)
    const orderItems = await prisma.orderItem.findMany({
      where: {
        accountId: accountId,
        order: {
          userId: session.user.id,
          status: 'COMPLETED',
        },
      },
      include: {
        order: {
          select: {
            id: true,
            customerName: true,
            userId: true,
            status: true,
          },
        },
      },
    });
    
    // Jika pengguna bukan pemilik akun dan bukan admin, tolak akses
    if (orderItems.length === 0 && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You do not have permission to update this account' },
        { status: 403 }
      );
    }
    
    // Tentukan apakah pengguna adalah admin
    const isAdmin = session.user.role === 'ADMIN';
    
    // Buat select options dinamis untuk account
    const selectOptions: Prisma.AccountSelect = {
      id: true,
      type: true,
      accountEmail: true,
      accountPassword: true,
      price: true,
      description: true,
      warranty: true,
      isActive: true,
      createdAt: true,
      duration: true,
      stock: true,
      profiles: isAdmin 
        ? { // Admin dapat melihat semua profil
            select: {
              id: true,
              name: true,
              pin: true,
              isKids: true,
              userId: true,
              orderId: true
            }
          }
        : { // Pengguna biasa dapat melihat profil yang dialokasikan atau profil yang terkait dengan pesanan mereka
            where: {
              OR: [
                { userId: session.user.id },
                {
                  orderId: {
                    in: orderItems.map(item => item.id)
                  }
                }
              ]
            },
            select: {
              id: true,
              name: true,
              pin: true,
              isKids: true
            }
          },
      orderItems: {
        select: {
          id: true,
          orderId: true,
          accountId: true,
          netflixProfile: {
            select: {
              id: true,
              name: true,
              pin: true,
              isKids: true,
              userId: true,
              orderId: true,
              account: {
                select: {
                  id: true,
                  type: true
                }
              }
            }
          },
          order: {
            select: {
              id: true,
              customerName: true,
              userId: true,
              status: true,
            },
          },
        },
      },
    };
    
    // Ambil detail akun
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: selectOptions,
    });
    
    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }
    
    // Perbarui akun yang sudah ada
    const updatedAccount = await prisma.account.update({
      where: { id: params.id },
      data: await request.json()
    });

    // Set header untuk memberitahu client bahwa ada perubahan pada status akun
    const headers = new Headers();
    headers.append('X-Status-Changed', 'true');

    return NextResponse.json({ 
      success: true, 
      message: 'Akun berhasil diperbarui',
      account: updatedAccount
    }, { headers });
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    );
  }
} 