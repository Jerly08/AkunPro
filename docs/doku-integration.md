# DOKU Payment Gateway Integration

## Pendahuluan
Dokumen ini berisi panduan integrasi DOKU Payment Gateway untuk aplikasi marketplace Netflix/Spotify. DOKU adalah payment gateway lokal Indonesia yang bisa digunakan oleh individu tanpa memerlukan badan usaha atau PT.

## Prasyarat
Untuk mengintegrasikan DOKU, Anda memerlukan:
1. Akun DOKU - Daftar di [https://www.doku.com](https://www.doku.com)
2. Client ID dan Secret Key dari dashboard DOKU
3. Merchant ID yang didapatkan setelah registrasi

## Konfigurasi Environment Variables
Tambahkan konfigurasi berikut di file `.env`:

```
# DOKU Payment Gateway Configuration
DOKU_BASE_URL=https://api-sandbox.doku.com  # Gunakan https://api.doku.com untuk production
DOKU_CLIENT_ID=your_client_id
DOKU_SECRET_KEY=your_secret_key
DOKU_MERCHANT_ID=your_merchant_id
```

## Cara Penggunaan

### 1. Membuat Pembayaran
Gunakan komponen `DokuPaymentButton` untuk memulai pembayaran:

```tsx
import DokuPaymentButton from '@/components/payment/DokuPaymentButton';

export default function CheckoutPage() {
  return (
    <DokuPaymentButton
      orderId="order-123"
      amount={150000}
      customerName="Nama Pelanggan"
      customerEmail="email@customer.com"
      items={[
        {
          name: "Netflix Premium",
          price: 150000,
          quantity: 1
        }
      ]}
      onSuccess={(data) => console.log('Payment initiated:', data)}
      onError={(error) => console.error('Payment error:', error)}
    />
  );
}
```

### 2. Callback / Webhook
DOKU akan mengirimkan notifikasi pembayaran ke endpoint yang sudah dibuat:
`/api/payment/doku` (PUT request)

Pastikan URL callback ini sudah didaftarkan di dashboard DOKU.

### 3. Mengecek Status Pembayaran
Status pembayaran akan diupdate di model `Transaction` berdasarkan notifikasi dari DOKU.

## Metode Pembayaran yang Didukung
DOKU mendukung berbagai metode pembayaran, termasuk:
- Kartu Kredit/Debit
- Virtual Account
- E-Wallet (OVO, Dana, LinkAja, dll)
- QRIS
- Minimarket (Indomaret, Alfamart)

## Alur Proses Pembayaran
1. User memilih produk dan checkout
2. Sistem membuat order di database
3. User memilih metode pembayaran DOKU
4. Sistem mengirim request ke API DOKU
5. User diarahkan ke halaman pembayaran DOKU
6. User menyelesaikan pembayaran
7. DOKU mengirim notifikasi status ke callback URL
8. Sistem mengupdate status pembayaran

## Panduan Pengujian
Untuk mode sandbox, gunakan detail kartu kredit berikut:
- Card Number: 4811 1111 1111 1114
- Expiry Date: Any future date (format MM/YY)
- CVV: Any 3 digits
- 3DS Password: 112233

## Catatan Penting
- Pastikan callback URL dapat diakses publik
- Mode sandbox tidak memerlukan pembayaran sungguhan
- Pastikan semua security key tetap rahasia dan tidak diekspos ke client-side 