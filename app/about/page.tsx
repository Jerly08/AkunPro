import { FiShield, FiClock, FiHeadphones, FiGlobe, FiUsers } from 'react-icons/fi';

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Tentang Kami
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Platform terpercaya untuk mendapatkan akun Netflix dan Spotify Premium dengan harga terjangkau dan garansi terjamin.
        </p>
      </div>

      {/* Visi & Misi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Visi Kami</h2>
          <p className="text-gray-600">
            Menjadi platform marketplace terpercaya untuk layanan streaming premium dengan memberikan pengalaman berbelanja yang aman, nyaman, dan terjangkau bagi semua pengguna.
          </p>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Misi Kami</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Menyediakan akun premium berkualitas dengan harga terjangkau</li>
            <li>Memberikan garansi dan dukungan pelanggan terbaik</li>
            <li>Membangun kepercayaan melalui transparansi dan kejujuran</li>
            <li>Mengembangkan platform yang user-friendly dan aman</li>
            <li>Mendukung pertumbuhan industri streaming di Indonesia</li>
          </ul>
        </div>
      </div>

      {/* Keunggulan */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Mengapa Memilih Kami?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiShield className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Terpercaya</h3>
            <p className="text-gray-600">
              Semua akun yang kami jual telah terverifikasi dan terjamin keasliannya
            </p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiClock className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Garansi</h3>
            <p className="text-gray-600">
              Setiap akun dilengkapi dengan garansi untuk memberikan ketenangan pikiran
            </p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiHeadphones className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Support 24/7</h3>
            <p className="text-gray-600">
              Tim support kami siap membantu Anda kapanpun dan dimanapun
            </p>
          </div>
          <div className="text-center">
            <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiGlobe className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Akses Global</h3>
            <p className="text-gray-600">
              Nikmati konten premium dari seluruh dunia tanpa batasan
            </p>
          </div>
        </div>
      </div>

      {/* Tim */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Tim Kami
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-gray-200 w-32 h-32 rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900">Admin</h3>
            <p className="text-gray-600">Pemilik Platform</p>
          </div>
          <div className="text-center">
            <div className="bg-gray-200 w-32 h-32 rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900">Customer Service</h3>
            <p className="text-gray-600">Tim Support</p>
          </div>
          <div className="text-center">
            <div className="bg-gray-200 w-32 h-32 rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900">Technical Team</h3>
            <p className="text-gray-600">Tim Teknis</p>
          </div>
        </div>
      </div>

      {/* Kontak */}
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Hubungi Kami
        </h2>
        <p className="text-gray-600 mb-6">
          Ada pertanyaan? Tim kami siap membantu Anda
        </p>
        <div className="flex justify-center space-x-4">
          <a
            href="mailto:support@example.com"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Email Kami
          </a>
          <a
            href="https://wa.me/6281234567890"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
} 