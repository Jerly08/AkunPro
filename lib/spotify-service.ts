import prisma from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';

/**
 * Service untuk mengelola slot Spotify dan alokasinya
 */
export class SpotifyService {
  /**
   * Membuat slot kosong untuk akun Spotify Family
   */
  static async createSlots(accountId: string, totalSlots: number): Promise<{ success: boolean; message: string; slots?: any[] }> {
    try {
      // Verifikasi akun ada dan family plan
      const account = await prisma.account.findUnique({
        where: { 
          id: accountId,
          type: 'SPOTIFY',
          isFamilyPlan: true 
        }
      });

      if (!account) {
        return { 
          success: false, 
          message: 'Akun Spotify tidak ditemukan atau bukan family plan' 
        };
      }

      // Cek berapa slot yang sudah ada
      const existingSlots = await prisma.spotifySlot.count({
        where: { accountId }
      });

      // Hitung slot baru yang perlu dibuat
      const newSlotsCount = Math.min(totalSlots, account.maxSlots - existingSlots);
      
      if (newSlotsCount <= 0) {
        return { 
          success: false, 
          message: `Akun sudah memiliki ${existingSlots} slot dari maksimal ${account.maxSlots}`
        };
      }

      // Buat slot baru
      const slots = [];
      for (let i = 0; i < newSlotsCount; i++) {
        const slotNumber = existingSlots + i + 1;
        const isMainAccount = existingSlots === 0 && i === 0; // Slot pertama yang dibuat adalah akun utama
        
        const slotName = isMainAccount ? 'Slot Utama' : `Slot Anggota ${slotNumber}`;
        
        // Untuk slot utama, gunakan kredensial akun asli
        const email = isMainAccount ? account.accountEmail : null;
        const password = isMainAccount ? account.accountPassword : null;
        
        const slot = await prisma.spotifySlot.create({
          data: {
            accountId,
            slotName,
            email,
            password,
            isActive: true,
            isAllocated: false,
            isMainAccount
          }
        });
        slots.push(slot);
      }

      return { 
        success: true, 
        message: `Berhasil membuat ${newSlotsCount} slot baru`,
        slots 
      };
    } catch (error) {
      console.error('Error creating Spotify slots:', error);
      return { 
        success: false, 
        message: 'Terjadi kesalahan saat membuat slot Spotify' 
      };
    }
  }

  /**
   * Mengalokasikan slot Spotify ke OrderItem dan User
   * @param orderItemId - ID orderItem yang akan dialokasikan slot
   * @param userId - ID user yang melakukan pembelian
   * @returns Object berisi status dan data slot yang dialokasikan
   */
  static async allocateSlotToOrder(orderItemId: string, userId: string) {
    console.log(`[SpotifyService] Mengalokasikan slot untuk OrderItem ID: ${orderItemId} dan User ID: ${userId}`);
    
    try {
      // 1. Periksa orderItem dan pastikan valid
      const orderItem = await prisma.orderItem.findUnique({
        where: { id: orderItemId },
        include: {
          account: true,
          order: true,
          spotifySlot: true
        }
      });
      
      if (!orderItem) {
        console.error(`[SpotifyService] OrderItem dengan ID ${orderItemId} tidak ditemukan`);
        return { success: false, message: 'OrderItem tidak ditemukan' };
      }
      
      // 2. Pastikan orderItem terkait dengan akun Spotify
      if (orderItem.account.type !== 'SPOTIFY') {
        console.error(`[SpotifyService] OrderItem bukan untuk akun Spotify (${orderItem.account.type})`);
        return { success: false, message: 'OrderItem bukan untuk akun Spotify' };
      }
      
      // 3. Pastikan pesanan sudah dibayar (PAID atau COMPLETED)
      if (orderItem.order.status !== 'PAID' && orderItem.order.status !== 'COMPLETED') {
        console.error(`[SpotifyService] Status pesanan belum PAID/COMPLETED (${orderItem.order.status})`);
        return { success: false, message: 'Pesanan belum dibayar' };
      }
      
      // 4. Periksa apakah orderItem sudah memiliki slot Spotify
      if (orderItem.spotifySlot) {
        console.log(`[SpotifyService] OrderItem sudah memiliki slot: ${orderItem.spotifySlot.slotName}`);
        return { 
          success: true, 
          message: 'OrderItem sudah memiliki slot Spotify',
          slot: orderItem.spotifySlot
        };
      }
      
      // 5. Cari slot Spotify yang tersedia (belum dialokasikan)
      const availableSlots = await prisma.spotifySlot.findMany({
        where: {
          accountId: orderItem.accountId,
          isAllocated: false,
          isActive: true,
          userId: null,
          orderItemId: null
        }
      });
      
      if (availableSlots.length === 0) {
        console.error(`[SpotifyService] Tidak ada slot Spotify yang tersedia untuk akun: ${orderItem.accountId}`);
        return { success: false, message: 'Tidak ada slot Spotify yang tersedia' };
      }
      
      // 6. Alokasikan slot pertama yang tersedia
      const slotToAssign = availableSlots[0];
      console.log(`[SpotifyService] Mengalokasikan slot: ${slotToAssign.slotName} (ID: ${slotToAssign.id})`);
      
      // 7. Generate kredensial unik untuk slot ini jika bukan akun utama
      // Format: email untuk slot menggunakan format username+slotX@domain.com
      let slotEmail = null;
      let slotPassword = null;

      if (!slotToAssign.isMainAccount) {
        const mainEmail = orderItem.account.accountEmail;
        const emailParts = mainEmail.split('@');
        if (emailParts.length === 2) {
          const [username, domain] = emailParts;
          slotEmail = `${username}+${slotToAssign.slotName.replace(/\s+/g, '')}@${domain}`;
          // Gunakan password yang berbeda atau sama dengan akun utama
          slotPassword = orderItem.account.accountPassword;
        }
      }
      
      // 8. Update slot dengan orderItem dan userId, serta kredensial unik
      const updatedSlot = await prisma.spotifySlot.update({
        where: { id: slotToAssign.id },
        data: {
          isAllocated: true,
          orderItemId: orderItemId,
          userId: userId,
          email: slotEmail,
          password: slotPassword
        }
      });
      
      console.log(`[SpotifyService] Slot berhasil dialokasikan: ${updatedSlot.slotName} untuk OrderItem: ${orderItemId}`);
      
      return {
        success: true,
        message: 'Slot Spotify berhasil dialokasikan',
        slot: updatedSlot
      };
      
    } catch (error) {
      console.error('[SpotifyService] Error saat mengalokasikan slot Spotify:', error);
      return { 
        success: false, 
        message: `Error saat mengalokasikan slot: ${(error as Error).message}`
      };
    }
  }
  
  /**
   * Memastikan semua pesanan Spotify yang sudah PAID/COMPLETED memiliki slot
   * Function ini dapat dijalankan secara terjadwal untuk memastikan tidak ada yang terlewat
   */
  static async ensureAllOrdersHaveSlots() {
    console.log('[SpotifyService] Memeriksa dan mengalokasikan slot untuk semua pesanan Spotify');
    
    try {
      // 1. Cari semua orderItem untuk akun Spotify yang belum memiliki slot
      const orderItemsWithoutSlots = await prisma.orderItem.findMany({
        where: {
          account: {
            type: 'SPOTIFY',
            isFamilyPlan: true
          },
          spotifySlot: null,
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
              type: true,
              isFamilyPlan: true
            }
          }
        }
      });
      
      console.log(`[SpotifyService] Menemukan ${orderItemsWithoutSlots.length} orderItem tanpa slot Spotify`);
      
      // 2. Alokasikan slot untuk setiap orderItem
      const results = [];
      for (const item of orderItemsWithoutSlots) {
        const result = await this.allocateSlotToOrder(item.id, item.order.userId);
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
        processed: orderItemsWithoutSlots.length,
        results
      };
      
    } catch (error) {
      console.error('[SpotifyService] Error saat memeriksa pesanan Spotify:', error);
      return { 
        success: false, 
        message: `Error saat memeriksa pesanan: ${(error as Error).message}`
      };
    }
  }

  /**
   * Menghitung jumlah slot Spotify yang tersedia (belum dialokasikan) untuk suatu akun
   * @param accountId - ID akun Spotify
   * @returns Jumlah slot yang tersedia
   */
  static async countAvailableSlots(accountId: string): Promise<number> {
    try {
      const count = await prisma.spotifySlot.count({
        where: {
          accountId: accountId,
          isAllocated: false,
          isActive: true
        }
      });
      
      console.log(`[SpotifyService] Akun ${accountId} memiliki ${count} slot tersedia`);
      return count;
    } catch (error) {
      console.error(`[SpotifyService] Error saat menghitung slot tersedia:`, error);
      return 0;
    }
  }

  /**
   * Mendapatkan informasi stok untuk semua akun Spotify
   * @returns Object berisi informasi stok
   */
  static async getAccountsStock() {
    try {
      // 1. Dapatkan semua akun Spotify yang memiliki family plan
      const spotifyAccounts = await prisma.account.findMany({
        where: { 
          type: 'SPOTIFY',
          isActive: true,
          isFamilyPlan: true
        }
      });

      // 2. Hitung slot tersedia untuk setiap akun
      const stockInfo = await Promise.all(
        spotifyAccounts.map(async (account) => {
          const totalSlots = await prisma.spotifySlot.count({
            where: { accountId: account.id }
          });
          
          const availableSlots = await this.countAvailableSlots(account.id);
          
          return {
            accountId: account.id,
            email: account.accountEmail,
            totalSlots,
            availableSlots,
            stock: availableSlots, // Stok adalah jumlah slot yang tersedia
            maxSlots: account.maxSlots || 6
          };
        })
      );
      
      // 3. Hitung total stok yang tersedia
      const totalAccounts = spotifyAccounts.length;
      const totalSlots = stockInfo.reduce((sum, account) => sum + account.totalSlots, 0);
      const totalStock = stockInfo.reduce((sum, account) => sum + account.availableSlots, 0);
      
      return {
        success: true,
        totalAccounts,
        totalSlots,
        totalStock,
        accounts: stockInfo
      };
    } catch (error) {
      console.error('[SpotifyService] Error saat mengambil informasi stok:', error);
      return { 
        success: false, 
        message: `Error: ${(error as Error).message}`
      };
    }
  }

  /**
   * Memperbarui stok akun Spotify dengan menghitung ulang slot yang tersedia
   * @param accountId - ID akun Spotify
   * @returns Object berisi status dan jumlah slot yang tersedia
   */
  static async updateAccountStock(accountId: string) {
    try {
      // 1. Periksa apakah akun ada dan aktif
      const account = await prisma.account.findUnique({
        where: {
          id: accountId,
          type: 'SPOTIFY'
        }
      });
      
      if (!account) {
        console.error(`[SpotifyService] Akun Spotify dengan ID ${accountId} tidak ditemukan`);
        return { success: false, message: 'Akun tidak ditemukan' };
      }
      
      // 2. Hitung slot yang tersedia
      const availableSlots = await this.countAvailableSlots(accountId);
      
      // 3. Update stok akun
      const updatedAccount = await prisma.account.update({
        where: { id: accountId },
        data: { stock: availableSlots }
      });
      
      console.log(`[SpotifyService] Stok akun ${accountId} diperbarui: ${availableSlots} slot tersedia`);
      
      return {
        success: true,
        accountId,
        stock: availableSlots
      };
    } catch (error) {
      console.error(`[SpotifyService] Error saat memperbarui stok akun:`, error);
      return { 
        success: false, 
        message: `Error: ${(error as Error).message}`
      };
    }
  }

  /**
   * Memperbarui stok semua akun Spotify
   * @returns Object berisi status dan jumlah akun yang diproses
   */
  static async updateAllAccountsStock() {
    try {
      // 1. Dapatkan semua akun Spotify
      const spotifyAccounts = await prisma.account.findMany({
        where: { 
          type: 'SPOTIFY',
          isActive: true,
          isFamilyPlan: true
        }
      });
      
      // 2. Update stok untuk setiap akun
      await Promise.all(
        spotifyAccounts.map(account => this.updateAccountStock(account.id))
      );
      
      console.log(`[SpotifyService] Stok untuk ${spotifyAccounts.length} akun Spotify berhasil diperbarui`);
      
      return {
        success: true,
        processed: spotifyAccounts.length
      };
    } catch (error) {
      console.error('[SpotifyService] Error saat memperbarui semua stok:', error);
      return { 
        success: false, 
        message: `Error: ${(error as Error).message}`
      };
    }
  }

  /**
   * Dapatkan informasi slot Spotify untuk pengguna
   */
  static async getUserSpotifySlots(userId: string): Promise<{ success: boolean; message: string; slots?: any[] }> {
    try {
      const slots = await prisma.spotifySlot.findMany({
        where: {
          userId,
          isActive: true,
          isAllocated: true
        },
        include: {
          account: {
            select: {
              accountEmail: true,
              accountPassword: true,
              description: true,
              warranty: true,
              duration: true,
              isFamilyPlan: true
            }
          },
          orderItem: {
            select: {
              orderId: true,
              price: true,
              createdAt: true
            }
          }
        }
      });

      return { 
        success: true, 
        message: 'Berhasil mendapatkan slot Spotify',
        slots 
      };
    } catch (error) {
      console.error('Error getting user Spotify slots:', error);
      return { 
        success: false, 
        message: 'Terjadi kesalahan saat mendapatkan slot Spotify' 
      };
    }
  }

  /**
   * Perbarui informasi slot Spotify
   */
  static async updateSlotInfo(slotId: string, data: { 
    slotName?: string; 
    email?: string; 
    password?: string; 
    isActive?: boolean; 
  }): Promise<{ success: boolean; message: string; slot?: any }> {
    try {
      const slot = await prisma.spotifySlot.update({
        where: { id: slotId },
        data
      });

      return { 
        success: true, 
        message: 'Informasi slot Spotify berhasil diperbarui',
        slot 
      };
    } catch (error) {
      console.error('Error updating Spotify slot:', error);
      return { 
        success: false, 
        message: 'Terjadi kesalahan saat memperbarui slot Spotify' 
      };
    }
  }

  /**
   * Dealokasikan slot Spotify
   */
  static async deallocateSlot(slotId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get slot first to get accountId
      const slot = await prisma.spotifySlot.findUnique({
        where: { id: slotId }
      });
      
      if (!slot) {
        return {
          success: false,
          message: 'Slot tidak ditemukan'
        };
      }
      
      // Deallocate the slot
      await prisma.spotifySlot.update({
        where: { id: slotId },
        data: {
          isAllocated: false,
          userId: null,
          orderItemId: null
        }
      });
      
      // Update stock count for the account
      await this.updateAccountStock(slot.accountId);

      return { 
        success: true, 
        message: 'Slot Spotify berhasil dialokasikan ulang' 
      };
    } catch (error) {
      console.error('Error deallocating Spotify slot:', error);
      return { 
        success: false, 
        message: 'Terjadi kesalahan saat mendealokasikan slot Spotify' 
      };
    }
  }

  /**
   * Creates a default slot for a Spotify account using the account's original credentials as the head account
   * @param accountId ID of the Spotify account to create a slot for
   * @returns The newly created slot
   */
  static async createDefaultSpotifySlot(accountId: string) {
    try {
      // Check if the account exists and is a Spotify account
      const account = await prisma.account.findUnique({
        where: { id: accountId },
        select: { 
          type: true, 
          isFamilyPlan: true,
          accountEmail: true,
          accountPassword: true
        }
      });

      if (!account) {
        throw new Error('Account not found');
      }

      if (account.type !== 'SPOTIFY') {
        throw new Error('Account is not a Spotify account');
      }

      // Check if there are any existing slots
      const existingSlots = await prisma.spotifySlot.findMany({
        where: { accountId }
      });

      // If there are already slots, don't create a default one
      if (existingSlots.length > 0) {
        return null;
      }

      // Create the default slot using the account's original email and password
      const newSlot = await prisma.spotifySlot.create({
        data: {
          accountId,
          slotName: 'Head Account',
          email: account.accountEmail,
          password: account.accountPassword,
          isActive: true,
          isAllocated: false,
          isMainAccount: true
        }
      });

      console.log(`Created default Spotify slot with ${account.accountEmail} as head account`);
      return newSlot;
    } catch (error) {
      console.error('Error creating default Spotify slot:', error);
      throw error;
    }
  }
} 