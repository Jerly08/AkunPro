export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Syarat dan Ketentuan</h1>
      
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-600 mb-6">
          Terima kasih telah mengunjungi AkunPro. Halaman ini berisi syarat dan ketentuan penggunaan layanan kami. 
          Mohon membaca dengan seksama sebelum menggunakan platform kami.
        </p>
        
        <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">1. Pendaftaran dan Akun</h2>
        <p>
          Untuk menggunakan layanan AkunPro, Anda harus mendaftar dan membuat akun dengan informasi yang akurat, 
          lengkap, dan terbaru. Anda bertanggung jawab untuk menjaga kerahasiaan dan keamanan kredensial akun Anda, 
          dan bertanggung jawab atas semua aktivitas yang terjadi di bawah akun Anda.
        </p>
        
        <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">2. Pembelian dan Pembayaran</h2>
        <ul className="list-disc pl-6 mb-6">
          <li className="mb-2">
            Harga yang ditampilkan dalam mata uang Rupiah Indonesia (IDR) dan sudah termasuk pajak yang berlaku.
          </li>
          <li className="mb-2">
            Pembayaran harus diselesaikan sebelum akun premium diberikan.
          </li>
          <li className="mb-2">
            AkunPro berhak untuk mengubah harga dan paket layanan sewaktu-waktu tanpa pemberitahuan terlebih dahulu.
          </li>
          <li className="mb-2">
            Setelah pembayaran dikonfirmasi, akun akan dikirimkan secara otomatis atau manual sesuai dengan jenis layanan.
          </li>
        </ul>
        
        <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">3. Penggunaan Layanan</h2>
        <p className="mb-4">
          Pengguna dilarang untuk:
        </p>
        <ul className="list-disc pl-6 mb-6">
          <li className="mb-2">
            Menggunakan layanan untuk tujuan ilegal atau melanggar hukum yang berlaku.
          </li>
          <li className="mb-2">
            Menjual kembali, mendistribusikan, atau membagikan akun yang dibeli melalui platform kami kepada pihak ketiga.
          </li>
          <li className="mb-2">
            Menggunakan VPN atau alat lain untuk mengakses konten yang dibatasi secara geografis jika melanggar ketentuan layanan penyedia konten.
          </li>
          <li className="mb-2">
            Mengubah kata sandi atau detail lainnya dari akun premium yang disediakan tanpa persetujuan dari AkunPro.
          </li>
        </ul>
        
        <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">4. Garansi</h2>
        <p>
          Kami menyediakan garansi untuk akun premium yang kami jual dengan ketentuan sebagai berikut:
        </p>
        <ul className="list-disc pl-6 mb-6">
          <li className="mb-2">
            Garansi berlaku sesuai dengan jangka waktu yang tercantum pada deskripsi produk.
          </li>
          <li className="mb-2">
            Garansi hanya berlaku jika pengguna mengikuti semua ketentuan penggunaan yang berlaku.
          </li>
          <li className="mb-2">
            Pengguna wajib melaporkan masalah pada akun dalam waktu 24 jam sejak ditemukannya masalah.
          </li>
          <li className="mb-2">
            Penggantian akun bergantung pada ketersediaan stok dan kebijakan kami.
          </li>
        </ul>
        
        <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">5. Pembatasan Tanggung Jawab</h2>
        <p>
          AkunPro tidak bertanggung jawab atas kerugian langsung atau tidak langsung yang timbul dari penggunaan atau 
          ketidakmampuan untuk menggunakan layanan kami, termasuk namun tidak terbatas pada kerugian akibat konten yang 
          tidak tersedia, perubahan kebijakan dari penyedia layanan streaming, atau masalah teknis lainnya.
        </p>
        
        <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">6. Privasi</h2>
        <p>
          Kami menghargai privasi Anda. Informasi yang kami kumpulkan dan bagaimana kami menggunakannya dijelaskan 
          dalam Kebijakan Privasi kami.
        </p>
        
        <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">7. Perubahan pada Syarat dan Ketentuan</h2>
        <p>
          Kami berhak untuk mengubah syarat dan ketentuan ini kapan saja. Perubahan akan berlaku segera setelah 
          diposting di platform kami. Penggunaan berkelanjutan dari layanan kami setelah perubahan tersebut 
          mengindikasikan penerimaan Anda terhadap syarat dan ketentuan yang diperbarui.
        </p>
        
        <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">8. Hukum yang Berlaku</h2>
        <p>
          Syarat dan ketentuan ini diatur oleh dan ditafsirkan sesuai dengan hukum Republik Indonesia.
        </p>
        
        <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">9. Hubungi Kami</h2>
        <p>
          Jika Anda memiliki pertanyaan tentang syarat dan ketentuan ini, silakan hubungi kami melalui email di 
          support@akunpromarketplace.com atau melalui fitur Chat di platform kami.
        </p>
        
        <div className="mt-12 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
} 