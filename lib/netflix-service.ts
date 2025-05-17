import prisma from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

/**
 * Service untuk mengelola profil Netflix dan alokasinya
 */
export class NetflixService {
  /**
   * Mengalokasikan profil Netflix ke OrderItem dan User
   * @param orderItemId - ID orderItem yang akan dialokasikan profil
   * @param userId - ID user yang melakukan pembelian
   * @returns Object berisi status dan data profil yang dialokasikan
   */
  static async allocateProfileToOrder(orderItemId: string, userId: string) {
    console.log(`[NetflixService] Mengalokasikan profil untuk OrderItem ID: ${orderItemId} dan User ID: ${userId}`);
    
    try {
      // 1. Periksa orderItem dan pastikan valid
      const orderItem = await prisma.orderItem.findUnique({
        where: { id: orderItemId },
        include: {
          account: true,
          order: true,
          netflixProfile: true
        }
      });
      
      if (!orderItem) {
        console.error(`[NetflixService] OrderItem dengan ID ${orderItemId} tidak ditemukan`);
        return { success: false, message: 'OrderItem tidak ditemukan' };
      }
      
      // 2. Pastikan orderItem terkait dengan akun Netflix
      if (orderItem.account.type !== 'NETFLIX') {
        console.error(`[NetflixService] OrderItem bukan untuk akun Netflix (${orderItem.account.type})`);
        return { success: false, message: 'OrderItem bukan untuk akun Netflix' };
      }
      
      // 3. Pastikan pesanan sudah dibayar (PAID atau COMPLETED)
      if (orderItem.order.status !== 'PAID' && orderItem.order.status !== 'COMPLETED') {
        console.error(`[NetflixService] Status pesanan belum PAID/COMPLETED (${orderItem.order.status})`);
        return { success: false, message: 'Pesanan belum dibayar' };
      }
      
      // 4. Periksa apakah orderItem sudah memiliki profil Netflix
      if (orderItem.netflixProfile) {
        console.log(`[NetflixService] OrderItem sudah memiliki profil: ${orderItem.netflixProfile.name}`);
        return { 
          success: true, 
          message: 'OrderItem sudah memiliki profil Netflix',
          profile: orderItem.netflixProfile
        };
      }
      
      // 5. Cari profil Netflix yang tersedia (belum dialokasikan)
      const availableProfiles = await prisma.netflixProfile.findMany({
        where: {
          accountId: orderItem.accountId,
          orderId: null, // Belum dialokasikan ke pesanan
          userId: null,  // Belum dialokasikan ke user
        }
      });
      
      // 6. Jika tidak ada profil tersedia di akun yang dipilih, cari profil di akun lain
      let profileToAssign;
      
      if (availableProfiles.length === 0) {
        console.log(`[NetflixService] Tidak ada profil tersedia di akun ${orderItem.accountId}, mencari di akun lain...`);
        
        // Cari akun Netflix lain yang memiliki profil tersedia
        const otherAvailableProfiles = await prisma.netflixProfile.findMany({
          where: {
            accountId: { not: orderItem.accountId },
            account: {
              type: 'NETFLIX',
              isActive: true,
              duration: orderItem.account.duration, // Pastikan durasi sama
            },
            orderId: null,
            userId: null,
          },
          include: {
            account: {
              select: {
                duration: true,
                price: true,
                warranty: true,
              }
            }
          }
        });
        
        if (otherAvailableProfiles.length === 0) {
          console.error(`[NetflixService] Tidak ada profil Netflix yang tersedia di semua akun`);
          return { success: false, message: 'Tidak ada profil Netflix yang tersedia' };
        }
        
        // Gunakan profil pertama yang ditemukan
        profileToAssign = otherAvailableProfiles[0];
        console.log(`[NetflixService] Menggunakan profil dari akun lain: ${profileToAssign.id}`);
        
        // Update orderItem untuk mereferensi akun yang baru
        await prisma.orderItem.update({
          where: { id: orderItemId },
          data: {
            accountId: profileToAssign.accountId
          }
        });
        
        console.log(`[NetflixService] OrderItem diperbarui untuk mereferensi akun: ${profileToAssign.accountId}`);
      } else {
        profileToAssign = availableProfiles[0];
      }
      
      console.log(`[NetflixService] Mengalokasikan profil: ${profileToAssign.name} (ID: ${profileToAssign.id})`);
      
      // 7. Update profil dengan orderItem dan userId
      const updatedProfile = await prisma.netflixProfile.update({
        where: { id: profileToAssign.id },
        data: {
          orderId: orderItemId,
          userId: userId
        }
      });
      
      // 8. Double-check bahwa hubungan dua arah sudah terbentuk dengan benar
      // Ini diperlukan karena kadang-kadang Prisma tidak memperbarui cache-nya dengan benar
      try {
        // Refresh prisma connection untuk memastikan cache bersih
        await prisma.$disconnect();
        await prisma.$connect();
        
        // Ambil ulang orderItem untuk memastikan hubungan dengan netflixProfile
        const refreshedOrderItem = await prisma.orderItem.findUnique({
          where: { id: orderItemId },
          include: {
            netflixProfile: true
          }
        });
        
        // Jika masih tidak ada hubungan yang benar, coba paksa update di sisi orderItem
        if (!refreshedOrderItem?.netflixProfile) {
          console.log(`[NetflixService] Hubungan dua arah tidak terbentuk, mencoba perbaiki dengan cara lain`);
          
          // Ini hack untuk memaksa hubungan terbentuk, meskipun seharusnya tidak diperlukan
          // dengan skema Prisma yang benar
          await prisma.$executeRaw`UPDATE order_items SET netflix_profile_id = ${updatedProfile.id} WHERE id = ${orderItemId}`;
          
          console.log(`[NetflixService] Pembaruan hubungan dipaksa via raw SQL`);
        }
      } catch (refreshError) {
        console.error(`[NetflixService] Error saat memverifikasi hubungan dua arah:`, refreshError);
        // Lanjutkan meskipun ada error, karena ini hanya pengecekan tambahan
      }
      
      console.log(`[NetflixService] Profil berhasil dialokasikan: ${updatedProfile.name} untuk OrderItem: ${orderItemId}`);
      
      return {
        success: true,
        message: 'Profil Netflix berhasil dialokasikan',
        profile: updatedProfile
      };
      
    } catch (error) {
      console.error('[NetflixService] Error saat mengalokasikan profil Netflix:', error);
      return { 
        success: false, 
        message: `Error saat mengalokasikan profil: ${(error as Error).message}`
      };
    }
  }
  
  /**
   * Memastikan semua pesanan Netflix yang sudah PAID/COMPLETED memiliki profil
   * Function ini dapat dijalankan secara terjadwal untuk memastikan tidak ada yang terlewat
   */
  static async ensureAllOrdersHaveProfiles() {
    console.log('[NetflixService] Memeriksa dan mengalokasikan profil untuk semua pesanan Netflix');
    
    try {
      // 1. Cari semua orderItem untuk akun Netflix yang belum memiliki profil
      const orderItemsWithoutProfiles = await prisma.orderItem.findMany({
        where: {
          account: {
            type: 'NETFLIX'
          },
          netflixProfile: null,
          order: {
            OR: [
              { status: 'PAID' },
              { status: 'COMPLETED' }
            ]
          }
        },
        include: {
          order: {
            select: {
              id: true,
              userId: true,
              status: true
            }
          },
          account: {
            select: {
              id: true,
              type: true
            }
          }
        }
      });
      
      console.log(`[NetflixService] Menemukan ${orderItemsWithoutProfiles.length} orderItem tanpa profil Netflix`);
      
      // 2. Alokasikan profil untuk setiap orderItem
      const results = [];
      for (const item of orderItemsWithoutProfiles) {
        const result = await this.allocateProfileToOrder(item.id, item.order.userId);
        results.push({
          orderItemId: item.id,
          orderId: item.order.id,
          userId: item.order.userId,
          success: result.success,
          message: result.message
        });
      }
      
      return {
        success: true,
        processed: orderItemsWithoutProfiles.length,
        results
      };
      
    } catch (error) {
      console.error('[NetflixService] Error saat memeriksa pesanan Netflix:', error);
      return { 
        success: false, 
        message: `Error saat memeriksa pesanan: ${(error as Error).message}`
      };
    }
  }

  /**
   * Menghitung jumlah profil Netflix yang tersedia (belum dialokasikan) untuk suatu akun
   * @param accountId - ID akun Netflix
   * @returns Jumlah profil yang tersedia
   */
  static async countAvailableProfiles(accountId: string): Promise<number> {
    try {
      const count = await prisma.netflixProfile.count({
        where: {
          accountId: accountId,
          orderId: null,
          userId: null
        }
      });
      
      console.log(`[NetflixService] Akun ${accountId} memiliki ${count} profil tersedia`);
      return count;
    } catch (error) {
      console.error(`[NetflixService] Error saat menghitung profil tersedia:`, error);
      return 0;
    }
  }

  /**
   * Mendapatkan informasi stok untuk semua akun Netflix
   * @returns Object berisi informasi stok
   */
  static async getAccountsStock() {
    try {
      // 1. Dapatkan semua akun Netflix
      const netflixAccounts = await prisma.account.findMany({
        where: { 
          type: 'NETFLIX',
          isActive: true
        }
      });

      // 2. Hitung profil tersedia untuk setiap akun
      const stockInfo = await Promise.all(
        netflixAccounts.map(async (account) => {
          const totalProfiles = await prisma.netflixProfile.count({
            where: { accountId: account.id }
          });
          
          const availableProfiles = await this.countAvailableProfiles(account.id);
          
          return {
            accountId: account.id,
            email: account.accountEmail,
            totalProfiles,
            availableProfiles,
            stock: availableProfiles // Stok adalah jumlah profil yang tersedia
          };
        })
      );

      // 3. Hitung total stok
      const totalStock = stockInfo.reduce((total, account) => total + account.availableProfiles, 0);
      
      return {
        success: true,
        accounts: stockInfo,
        totalAccounts: netflixAccounts.length,
        totalProfiles: stockInfo.reduce((total, account) => total + account.totalProfiles, 0),
        totalAvailableProfiles: totalStock,
        totalStock // Total stok sama dengan total profil tersedia
      };
    } catch (error) {
      console.error('[NetflixService] Error saat mengambil informasi stok:', error);
      return { 
        success: false,
        message: `Error saat mengambil informasi stok: ${(error as Error).message}`,
        accounts: [],
        totalAccounts: 0,
        totalProfiles: 0,
        totalAvailableProfiles: 0,
        totalStock: 0
      };
    }
  }

  /**
   * Update stok akun berdasarkan profil yang tersedia
   * @param accountId - ID akun Netflix
   * @returns Object berisi status operasi
   */
  static async updateAccountStock(accountId: string) {
    try {
      const availableProfiles = await this.countAvailableProfiles(accountId);
      
      await prisma.account.update({
        where: { id: accountId },
        data: { stock: availableProfiles }
      });
      
      return {
        success: true,
        accountId,
        stock: availableProfiles
      };
    } catch (error) {
      console.error(`[NetflixService] Error saat mengupdate stok akun:`, error);
      return {
        success: false,
        message: `Error saat mengupdate stok akun: ${(error as Error).message}`,
        accountId
      };
    }
  }

  /**
   * Update stok semua akun Netflix berdasarkan profil yang tersedia
   * @returns Object berisi status operasi
   */
  static async updateAllAccountsStock() {
    try {
      const netflixAccounts = await prisma.account.findMany({
        where: { type: 'NETFLIX' }
      });
      
      const results = await Promise.all(
        netflixAccounts.map(account => this.updateAccountStock(account.id))
      );
      
      return {
        success: true,
        processed: netflixAccounts.length,
        results
      };
    } catch (error) {
      console.error('[NetflixService] Error saat mengupdate semua stok akun:', error);
      return {
        success: false,
        message: `Error saat mengupdate semua stok akun: ${(error as Error).message}`,
        processed: 0,
        results: []
      };
    }
  }
} 