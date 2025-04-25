import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * POST /api/netflix/refresh-profile
 * Refresh profil Netflix dengan memaksa hubungan antara profile dan orderItem
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { accountId, profileId } = body;
    
    if (!accountId) {
      return NextResponse.json(
        { success: false, message: 'Account ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Refreshing Netflix profiles for account ID: ${accountId}${profileId ? `, profile ID: ${profileId}` : ''}`);
    
    // Cari semua profil Netflix untuk akun ini
    const profilesQuery = {
      where: { 
        accountId,
        // Jika profileId disediakan, filter hanya untuk profil itu
        ...(profileId ? { id: profileId } : {}),
        // Cari profil yang terkait dengan user yang login
        OR: [
          { userId: session.user.id },
          { orderItem: { order: { userId: session.user.id } } }
        ]
      },
      include: {
        orderItem: true
      }
    };
    
    const profiles = await prisma.netflixProfile.findMany(profilesQuery);
    
    console.log(`Found ${profiles.length} profiles for account`);
    
    // Cari orderItem yang terkait dengan akun ini dan user yang login
    const orderItems = await prisma.orderItem.findMany({
      where: {
        accountId,
        order: {
          userId: session.user.id,
          status: {
            in: ['PAID', 'COMPLETED']
          }
        }
      },
      include: {
        netflixProfile: true,
        order: true
      }
    });
    
    console.log(`Found ${orderItems.length} order items for account and user`);
    
    // Cek mana yang terputus
    const results: any[] = [];
    
    // 1. Cek profil yang terputus dari orderItem
    for (const profile of profiles) {
      if (profile.orderId && !profile.orderItem) {
        console.log(`Profile ${profile.id} has orderId but no orderItem. Trying to fix...`);
        
        // Cari orderItem yang mungkin perlu ditautkan
        const matchingOrderItem = orderItems.find(item => 
          !item.netflixProfile && item.order.userId === session.user.id
        );
        
        if (matchingOrderItem) {
          // Update profil untuk menautkan ke orderItem
          const updatedProfile = await prisma.netflixProfile.update({
            where: { id: profile.id },
            data: { 
              orderId: matchingOrderItem.id,
              userId: session.user.id
            }
          });
          
          console.log(`Fixed profile ${profile.id} by linking to orderItem ${matchingOrderItem.id}`);
          results.push({
            type: 'profile_fixed',
            profileId: profile.id,
            orderItemId: matchingOrderItem.id
          });
        } else {
          console.log(`No matching orderItem found for profile ${profile.id}`);
        }
      }
    }
    
    // 2. Cek orderItem yang tidak memiliki profil
    // Jika profileId disediakan, prioritaskan profil spesifik tersebut
    for (const item of orderItems) {
      if (!item.netflixProfile) {
        console.log(`OrderItem ${item.id} has no profile. Trying to find one...`);
        
        // Query dasar untuk mencari profil
        const profileQuery = {
          where: {
            accountId,
            orderId: null,
            userId: null
          }
        };
        
        // Jika profileId ada dan belum diproses, utamakan profil tersebut
        if (profileId && !results.some(r => r.profileId === profileId)) {
          const specificProfile = await prisma.netflixProfile.findUnique({
            where: { id: profileId }
          });
          
          if (specificProfile && !specificProfile.orderId && !specificProfile.userId) {
            // Update profil untuk menautkan ke orderItem
            const updatedProfile = await prisma.netflixProfile.update({
              where: { id: profileId },
              data: { 
                orderId: item.id, 
                userId: session.user.id
              }
            });
            
            console.log(`Allocated specified profile ${profileId} to orderItem ${item.id}`);
            results.push({
              type: 'specified_profile_allocated',
              profileId: profileId,
              orderItemId: item.id
            });
            continue; // Lanjut ke item berikutnya
          }
        }
        
        // Jika tidak ada profileId atau profileId sudah diproses, cari profil lain
        const availableProfile = await prisma.netflixProfile.findFirst(profileQuery);
        
        if (availableProfile) {
          // Update profil untuk menautkan ke orderItem
          const updatedProfile = await prisma.netflixProfile.update({
            where: { id: availableProfile.id },
            data: { 
              orderId: item.id, 
              userId: session.user.id
            }
          });
          
          console.log(`Allocated profile ${availableProfile.id} to orderItem ${item.id}`);
          results.push({
            type: 'orderitem_fixed',
            profileId: availableProfile.id,
            orderItemId: item.id
          });
        } else {
          console.log(`No available profile found for orderItem ${item.id}`);
        }
      }
    }
    
    // Jika tidak ada perbaikan yang dilakukan, coba paksa dengan raw SQL
    if (results.length === 0 && profiles.length > 0 && orderItems.length > 0) {
      console.log('No automatic fixes were made. Trying direct SQL approach...');
      
      try {
        // Jika profileId disediakan, gunakan profil tersebut
        let bestProfile;
        if (profileId) {
          bestProfile = await prisma.netflixProfile.findUnique({
            where: { id: profileId }
          });
        }
        
        // Jika tidak ada profileId atau profil spesifik tidak ditemukan, gunakan profil pertama
        if (!bestProfile) {
          bestProfile = profiles[0]; // Ambil profil pertama saja
        }
        
        const bestOrderItem = orderItems[0]; // Ambil orderItem pertama saja
        
        // Update via raw SQL untuk memastikan
        await prisma.$executeRaw`UPDATE netflix_profiles SET order_id = ${bestOrderItem.id}, user_id = ${session.user.id} WHERE id = ${bestProfile.id}`;
        
        console.log(`Forced update via SQL: Profile ${bestProfile.id} linked to OrderItem ${bestOrderItem.id}`);
        results.push({
          type: 'sql_forced',
          profileId: bestProfile.id,
          orderItemId: bestOrderItem.id
        });
      } catch (sqlError) {
        console.error('Error executing raw SQL:', sqlError);
      }
    }
    
    // 5. Update stok akun Netflix setelah refresh profile
    try {
      // Import NetflixService jika belum
      const { NetflixService } = require('@/lib/netflix-service');
      await NetflixService.updateAccountStock(accountId);
      console.log(`Netflix stock for account ${accountId} has been updated`);
    } catch (stockError) {
      console.error('Error updating Netflix stock:', stockError);
      // Lanjutkan meskipun gagal update stok
    }
    
    // Refresh cache prisma
    await prisma.$disconnect();
    await prisma.$connect();
    
    return NextResponse.json({
      success: true,
      message: `Profile refresh complete. Made ${results.length} fixes.`,
      fixes: results,
      profiles: profiles.length,
      orderItems: orderItems.length
    });
    
  } catch (error) {
    console.error('Error in refresh-profile:', error);
    return NextResponse.json(
      { success: false, message: `Error: ${(error as Error).message}` },
      { status: 500 }
    );
  }
} 