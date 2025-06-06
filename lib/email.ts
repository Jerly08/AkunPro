import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Konfigurasi transporter email
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER || 'akunproofficial@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'lpnq ykxf yacr mjfe',
  },
});

// Interface untuk data email
interface EmailData {
  to: string;
  subject: string;
  html: string;
  attachments?: any[];
}

// CID for the logo in emails
const LOGO_CID = 'akunpro-logo';

// Function to check if image file exists
function getImagePath(): string | null {
  try {
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'images', 'karakter_akunpro.png'),
      path.join(process.cwd(), '/public/images/karakter_akunpro.png'),
      path.join(__dirname, '..', 'public', 'images', 'karakter_akunpro.png'),
      path.resolve('public/images/karakter_akunpro.png')
    ];
    
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        console.log(`Found logo image at: ${testPath}`);
        return testPath;
      }
    }
    return null;
  } catch (error) {
    console.error('Error finding image path:', error);
    return null;
  }
}

// Fungsi untuk mengirim email
export async function sendEmail({ to, subject, html, attachments = [] }: EmailData) {
  try {
    console.log(`Attempting to send email to: ${to}`);
    console.log(`Subject: ${subject}`);
    
    // Check if we need to add the logo attachment
    let emailAttachments = [...attachments];
    const imagePath = getImagePath();
    
    if (html.includes(`cid:${LOGO_CID}`) && imagePath) {
      // Add the logo as an inline attachment
      emailAttachments.push({
        filename: 'karakter_akunpro.png',
        path: imagePath,
        cid: LOGO_CID // same cid value as in the html img src
      });
    }
    
    const info = await transporter.sendMail({
      from: `"AkunPro" <${process.env.EMAIL_USER || 'akunproofficial@gmail.com'}>`,
      to,
      subject,
      html,
      attachments: emailAttachments
    });

    console.log('Email sent successfully:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected
    });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      to,
      subject
    });
    return { success: false, error };
  }
}

// Template email untuk transaksi
export function generateTransactionEmailTemplate(
  customerName: string,
  orderId: string,
  totalAmount: number,
  status: string,
  items: Array<{ name: string; price: number }>
) {
  const statusColor = {
    'PENDING': '#FFA500',
    'PAID': '#4CAF50',
    'FAILED': '#F44336',
    'CANCELLED': '#9E9E9E',
    'REFUNDED': '#2196F3'
  }[status] || '#000000';

  const statusText = {
    'PENDING': 'Menunggu Pembayaran',
    'PAID': 'Pembayaran Berhasil',
    'FAILED': 'Pembayaran Gagal',
    'CANCELLED': 'Dibatalkan',
    'REFUNDED': 'Dikembalikan'
  }[status] || status;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Konfirmasi Transaksi</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <img src="cid:${LOGO_CID}" alt="AkunPro" width="150" height="auto" style="display: block; max-width: 150px; margin-bottom: 20px; border: 0; outline: none; text-decoration: none;">
        
        <h1 style="color: #2c3e50; margin-bottom: 20px;">Halo ${customerName},</h1>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          Terima kasih telah melakukan transaksi di AkunPro. Berikut adalah detail transaksi Anda:
        </p>

        <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="margin-bottom: 15px;">
            <strong style="color: #2c3e50;">Order ID:</strong>
            <span style="color: #666;">${orderId}</span>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #2c3e50;">Status:</strong>
            <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #2c3e50;">Total Pembayaran:</strong>
            <span style="color: #666; font-size: 18px;">Rp ${totalAmount.toLocaleString()}</span>
          </div>
        </div>

        <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #2c3e50; margin-bottom: 15px;">Detail Item:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Item</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Harga</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${item.name}</td>
                  <td style="padding: 10px; text-align: right; border-bottom: 1px solid #dee2e6;">Rp ${item.price.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        ${status === 'PENDING' ? `
          <div style="background-color: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #856404;">Pembayaran Belum Diterima</h3>
            <p style="margin-bottom: 10px;">Silakan selesaikan pembayaran Anda dalam waktu 24 jam untuk menghindari pembatalan otomatis.</p>
            <p style="margin-bottom: 0;"><strong>Rekening Bank:</strong></p>
            <ul style="margin-top: 5px; padding-left: 20px;">
              <li>BCA: 1234567890 (PT. NETFLIX SPOTIFY MARKETPLACE)</li>
              <li>BNI: 0987654321 (PT. NETFLIX SPOTIFY MARKETPLACE)</li>
            </ul>
          </div>
        ` : ''}

        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #1976d2;">Butuh Bantuan?</h3>
          <p style="margin-bottom: 5px;">Tim support kami siap membantu Anda:</p>
          <ul style="margin-top: 5px; padding-left: 20px;">
            <li>Email: support@akunpro.com</li>
            <li>WhatsApp: +62 812-3456-7890</li>
            <li>Jam Operasional: 09:00 - 21:00 WIB</li>
          </ul>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="color: #666; font-size: 12px; margin-bottom: 5px;">© 2024 AkunPro. All rights reserved.</p>
          <p style="color: #666; font-size: 12px; margin: 0;">Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Helper function untuk mengirim email transaksi
export async function sendTransactionEmail(
  customerName: string,
  customerEmail: string,
  orderId: string,
  totalAmount: number,
  status: string,
  items: Array<{ name: string; price: number }>
) {
  try {
    console.log(`Preparing transaction email for order ${orderId}`);
    console.log(`Customer: ${customerName} (${customerEmail})`);
    console.log(`Status: ${status}`);
    console.log(`Items: ${JSON.stringify(items)}`);

    const emailTemplate = generateTransactionEmailTemplate(
      customerName,
      orderId,
      totalAmount,
      status,
      items
    );

    const result = await sendEmail({
      to: customerEmail,
      subject: `Konfirmasi Transaksi - ${orderId}`,
      html: emailTemplate
    });

    if (result.success) {
      console.log(`Transaction email sent successfully for order ${orderId}`);
    } else {
      console.error(`Failed to send transaction email for order ${orderId}:`, result.error);
    }

    return result;
  } catch (error) {
    console.error('Error sending transaction email:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      orderId,
      customerEmail
    });
    throw error;
  }
}

// Template untuk email detail akun setelah pembayaran terverifikasi
export function generateAccountDetailsEmailTemplate(
  customerName: string,
  orderId: string,
  totalAmount: number,
  paymentMethod: string,
  paymentDate: Date,
  accounts: Array<{
    type: 'NETFLIX' | 'SPOTIFY',
    email: string, 
    password: string, 
    profile?: string,
    purchaseDate: Date,
    expiryDate: Date
  }>
) {
  const formattedDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Detail Akun - AkunPro</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <img src="cid:${LOGO_CID}" alt="AkunPro" width="150" height="auto" style="display: block; max-width: 150px; margin-bottom: 20px; border: 0; outline: none; text-decoration: none;">
        
        <h1 style="color: #2c3e50; margin-bottom: 20px;">Halo ${customerName},</h1>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          Terima kasih telah berbelanja di AkunPro. Pembayaran Anda telah berhasil diverifikasi.
          Berikut adalah detail akun yang telah Anda beli:
        </p>

        ${accounts.map(account => `
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: ${account.type === 'NETFLIX' ? '#E50914' : '#1DB954'}; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid ${account.type === 'NETFLIX' ? '#E50914' : '#1DB954'}; padding-bottom: 8px;">
              Akun ${account.type === 'NETFLIX' ? 'Netflix' : 'Spotify'}
            </h3>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #2c3e50; display: block; margin-bottom: 5px;">Email</strong>
              <span style="display: block; padding: 8px; background-color: #f8f9fa; border-radius: 4px; font-family: monospace;">${account.email}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #2c3e50; display: block; margin-bottom: 5px;">Password</strong>
              <span style="display: block; padding: 8px; background-color: #f8f9fa; border-radius: 4px; font-family: monospace;">${account.password}</span>
            </div>
            
            ${account.profile ? `
              <div style="margin-bottom: 15px;">
                <strong style="color: #2c3e50; display: block; margin-bottom: 5px;">Profil</strong>
                <span style="display: block; padding: 8px; background-color: #f8f9fa; border-radius: 4px;">${account.profile}</span>
              </div>
            ` : ''}
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #2c3e50; display: block; margin-bottom: 5px;">Tanggal Pembelian</strong>
              <span style="display: block; padding: 8px; background-color: #f8f9fa; border-radius: 4px;">${formattedDate(account.purchaseDate)}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #2c3e50; display: block; margin-bottom: 5px;">Berlaku Hingga</strong>
              <span style="display: block; padding: 8px; background-color: #f8f9fa; border-radius: 4px;">${formattedDate(account.expiryDate)}</span>
            </div>
          </div>
        `).join('')}

        <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #2c3e50; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #dee2e6; padding-bottom: 8px;">
            Detail Pembayaran
          </h3>
          
          <div style="margin-bottom: 10px;">
            <strong style="color: #2c3e50;">Total Pembayaran:</strong>
            <span style="color: #666; font-weight: bold;">Rp ${totalAmount.toLocaleString()}</span>
          </div>
          
          <div style="margin-bottom: 10px;">
            <strong style="color: #2c3e50;">Tanggal:</strong>
            <span style="color: #666;">${formattedDate(paymentDate)}</span>
          </div>
          
          <div style="margin-bottom: 10px;">
            <strong style="color: #2c3e50;">Metode Pembayaran:</strong>
            <span style="color: #666;">${paymentMethod}</span>
          </div>
          
          <div style="margin-bottom: 10px;">
            <strong style="color: #2c3e50;">Order ID:</strong>
            <span style="color: #666;">${orderId}</span>
          </div>
        </div>

        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #1976d2;">Catatan Penting:</h3>
          <ul style="margin-top: 5px; padding-left: 20px;">
            <li>Jangan pernah mengubah password akun</li>
            <li>Jangan menggunakan VPN saat login akun</li>
            <li>Jangan berbagi akun di luar keluarga Anda</li>
            <li>Jika ada masalah dengan akun, segera hubungi kami</li>
          </ul>
        </div>

        <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #2e7d32;">Butuh Bantuan?</h3>
          <p style="margin-bottom: 5px;">Tim support kami siap membantu Anda:</p>
          <ul style="margin-top: 5px; padding-left: 20px;">
            <li>Email: support@akunpro.com</li>
            <li>WhatsApp: +62 812-3456-7890</li>
            <li>Jam Operasional: 09:00 - 21:00 WIB</li>
          </ul>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="color: #666; font-size: 12px; margin-bottom: 5px;">© 2024 AkunPro. All rights reserved.</p>
          <p style="color: #666; font-size: 12px; margin: 0;">Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Helper function untuk mengirim email detail akun setelah pembayaran terverifikasi
export async function sendAccountDetailsEmail(
  customerName: string,
  customerEmail: string,
  orderId: string,
  totalAmount: number,
  paymentMethod: string,
  paymentDate: Date,
  accounts: Array<{
    type: 'NETFLIX' | 'SPOTIFY',
    email: string, 
    password: string, 
    profile?: string,
    purchaseDate: Date,
    expiryDate: Date
  }>
) {
  try {
    console.log(`Preparing account details email for order ${orderId}`);
    console.log(`Customer: ${customerName} (${customerEmail})`);
    console.log(`Number of accounts: ${accounts.length}`);

    const emailTemplate = generateAccountDetailsEmailTemplate(
      customerName,
      orderId,
      totalAmount,
      paymentMethod,
      paymentDate,
      accounts
    );

    const result = await sendEmail({
      to: customerEmail,
      subject: `Detail Akun Anda - AkunPro`,
      html: emailTemplate
    });

    if (result.success) {
      console.log(`Account details email sent successfully for order ${orderId}`);
    } else {
      console.error(`Failed to send account details email for order ${orderId}:`, result.error);
    }

    return result;
  } catch (error) {
    console.error('Error sending account details email:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      orderId,
      customerEmail
    });
    throw error;
  }
}

// Allow direct testing of the logo URL (for backward compatibility)
export const getLogoUrl = () => {
  const imagePath = getImagePath();
  if (imagePath) {
    return `file://${imagePath}`;
  }
  return 'https://raw.githubusercontent.com/yasermazlum/AkunPro/main/public/images/karakter_akunpro.png';
}; 