import { User } from '@prisma/client';
import prisma from './prisma';

type NotificationType = 'SMS' | 'WHATSAPP' | 'EMAIL';
type NotificationChannel = {
  type: NotificationType;
  handler: (user: User, message: string) => Promise<boolean>;
};

export class NotificationService {
  private static channels: NotificationChannel[] = [
    {
      type: 'SMS',
      handler: async (user: User, message: string) => {
        // Implementasi pengiriman SMS dapat ditambahkan di sini
        // Misalnya menggunakan Twilio, Nexmo, dll.
        console.log(`[SMS] Kirim ke ${user.settings ? JSON.parse(user.settings).phone || 'unknown' : 'unknown'}: ${message}`);
        return true;
      }
    },
    {
      type: 'WHATSAPP',
      handler: async (user: User, message: string) => {
        // Implementasi pengiriman WhatsApp dapat ditambahkan di sini
        // Misalnya menggunakan Twilio, WhatsApp Business API, dll.
        console.log(`[WhatsApp] Kirim ke ${user.settings ? JSON.parse(user.settings).phone || 'unknown' : 'unknown'}: ${message}`);
        return true;
      }
    },
    {
      type: 'EMAIL',
      handler: async (user: User, message: string) => {
        // Implementasi pengiriman email dapat ditambahkan di sini
        // Misalnya menggunakan Nodemailer, SendGrid, dll.
        console.log(`[Email] Kirim ke ${user.email}: ${message}`);
        return true;
      }
    }
  ];

  /**
   * Mengirim notifikasi ke pengguna berdasarkan jenis akun yang dibeli
   */
  static async sendAccountPurchaseNotification(
    userId: string, 
    orderItemId: string,
    channelType: NotificationType = 'EMAIL'
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Ambil data pengguna
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return { success: false, message: 'Pengguna tidak ditemukan' };
      }

      // Ambil data OrderItem beserta detailnya
      const orderItem = await prisma.orderItem.findUnique({
        where: { id: orderItemId },
        include: {
          account: true,
          order: true,
          netflixProfile: true,
          spotifySlot: true
        }
      });

      if (!orderItem) {
        return { success: false, message: 'Item pesanan tidak ditemukan' };
      }

      // Buat pesan notifikasi berdasarkan jenis akun
      let message = `Halo ${user.name},\n\nTerima kasih telah berbelanja di layanan kami. `;

      if (orderItem.account.type === 'NETFLIX') {
        if (!orderItem.netflixProfile) {
          return { success: false, message: 'Profil Netflix belum dialokasikan' };
        }

        message += `Berikut adalah detail akun Netflix Anda:\n\n`;
        message += `Email: ${orderItem.account.accountEmail}\n`;
        message += `Password: ${orderItem.account.accountPassword}\n`;
        message += `Profil: ${orderItem.netflixProfile.name}\n`;
        message += `PIN: ${orderItem.netflixProfile.pin || 'Tidak ada'}\n`;
        message += `Masa Aktif: ${orderItem.order.expiresAt ? orderItem.order.expiresAt.toLocaleDateString() : 'Tidak ditentukan'}\n\n`;
        message += `Selamat menikmati layanan Netflix kami!`;
      } else if (orderItem.account.type === 'SPOTIFY') {
        if (!orderItem.spotifySlot) {
          return { success: false, message: 'Slot Spotify belum dialokasikan' };
        }

        message += `Berikut adalah detail akun Spotify Anda:\n\n`;
        message += `Email: ${orderItem.account.accountEmail}\n`;
        message += `Password: ${orderItem.account.accountPassword}\n`;
        message += `Slot: ${orderItem.spotifySlot.slotName || orderItem.spotifySlot.id}\n`;
        message += `Masa Aktif: ${orderItem.order.expiresAt ? orderItem.order.expiresAt.toLocaleDateString() : 'Tidak ditentukan'}\n\n`;
        message += `Selamat menikmati layanan Spotify kami!`;
      } else {
        message += `Terima kasih telah membeli ${orderItem.account.type}. Detail akun akan dikirimkan dalam waktu 24 jam.`;
      }

      // Cari channel notifikasi yang sesuai
      const channel = this.channels.find(ch => ch.type === channelType);
      if (!channel) {
        return { success: false, message: `Channel notifikasi ${channelType} tidak tersedia` };
      }

      // Kirim notifikasi menggunakan channel yang dipilih
      const sent = await channel.handler(user, message);
      
      return { 
        success: sent, 
        message: sent ? 'Notifikasi berhasil dikirim' : 'Gagal mengirim notifikasi' 
      };
    } catch (error) {
      console.error('Error sending notification:', error);
      return { success: false, message: `Error: ${(error as Error).message}` };
    }
  }
} 