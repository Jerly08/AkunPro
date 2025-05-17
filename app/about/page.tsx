'use client';

import { FiShield, FiClock, FiHeadphones, FiGlobe, FiUsers, FiStar, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useState } from 'react';

// FAQ Accordion component
const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-gray-200 py-4">
      <button
        className="flex justify-between items-center w-full text-left font-medium text-gray-900"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{question}</span>
        {isOpen ? (
          <FiChevronUp className="w-5 h-5 text-indigo-600" />
        ) : (
          <FiChevronDown className="w-5 h-5 text-indigo-600" />
        )}
      </button>
      <div className={`mt-2 text-gray-600 ${isOpen ? 'block' : 'hidden'}`}>
        <p>{answer}</p>
      </div>
    </div>
  );
};

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

      {/* Testimoni Pelanggan */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Testimoni Pelanggan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center text-yellow-500 mb-4">
              <FiStar className="fill-current" />
              <FiStar className="fill-current" />
              <FiStar className="fill-current" />
              <FiStar className="fill-current" />
              <FiStar className="fill-current" />
            </div>
            <p className="text-gray-600 mb-4">
              "Saya sudah berlangganan Netflix melalui AkunPro selama 6 bulan dan tidak pernah mengalami masalah. Harga terjangkau dan layanan sangat memuaskan!"
            </p>
            <div className="flex items-center">
              <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                <span className="font-semibold text-blue-600">AR</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Andi Rahmat</h4>
                <p className="text-sm text-gray-500">Jakarta</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center text-yellow-500 mb-4">
              <FiStar className="fill-current" />
              <FiStar className="fill-current" />
              <FiStar className="fill-current" />
              <FiStar className="fill-current" />
              <FiStar className="fill-current" />
            </div>
            <p className="text-gray-600 mb-4">
              "Pelayanan cepat dan responsif. Customer service sangat membantu ketika saya mengalami kendala pada akun Spotify Premium saya. Sangat direkomendasikan!"
            </p>
            <div className="flex items-center">
              <div className="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                <span className="font-semibold text-green-600">DS</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Dewi Sartika</h4>
                <p className="text-sm text-gray-500">Surabaya</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center text-yellow-500 mb-4">
              <FiStar className="fill-current" />
              <FiStar className="fill-current" />
              <FiStar className="fill-current" />
              <FiStar className="fill-current" />
              <FiStar className="fill-current" />
            </div>
            <p className="text-gray-600 mb-4">
              "Awalnya ragu untuk membeli, tapi setelah mencoba, saya sangat puas dengan layanan AkunPro. Proses pembelian mudah dan harga sangat bersaing. Pasti akan beli lagi!"
            </p>
            <div className="flex items-center">
              <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                <span className="font-semibold text-purple-600">BP</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Budi Prakoso</h4>
                <p className="text-sm text-gray-500">Bandung</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistik Layanan */}
      <div className="mb-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg overflow-hidden">
        <div className="py-10 px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Pertumbuhan Layanan Kami
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold mb-2">5000+</p>
              <p className="text-lg opacity-80">Pelanggan Puas</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">8000+</p>
              <p className="text-lg opacity-80">Transaksi Sukses</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">99%</p>
              <p className="text-lg opacity-80">Tingkat Kepuasan</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">24/7</p>
              <p className="text-lg opacity-80">Dukungan Pelanggan</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Pertanyaan Umum
        </h2>
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <FAQItem 
            question="Apa itu Akun Pro?" 
            answer="Akun Pro adalah platform marketplace terpercaya untuk membeli akun Netflix dan Spotify Premium dengan harga terjangkau, jaminan keamanan, dan dukungan pelanggan yang responsif."
          />
          <FAQItem 
            question="Apakah akun yang dijual legal?" 
            answer="Ya, semua akun yang kami jual adalah legal dan berlisensi resmi dari penyedia layanan. Kami memastikan keamanan dan legalitas semua produk yang kami tawarkan."
          />
          <FAQItem 
            question="Berapa lama proses pengiriman akun setelah pembayaran?" 
            answer="Proses pengiriman akun dilakukan secara otomatis dan instan setelah pembayaran berhasil diverifikasi. Dalam beberapa kasus, proses verifikasi pembayaran mungkin memerlukan waktu hingga 15 menit."
          />
          <FAQItem 
            question="Bagaimana jika akun yang saya beli bermasalah?" 
            answer="Kami memberikan garansi untuk setiap akun yang dijual. Jika mengalami masalah, Anda dapat menghubungi tim support kami melalui fitur chat atau WhatsApp yang tersedia 24/7, dan kami akan segera membantu menyelesaikan masalah Anda."
          />
          <FAQItem 
            question="Apakah saya bisa berbagi akun dengan orang lain?" 
            answer="Setiap akun memiliki ketentuan penggunaan yang berbeda tergantung dari jenis layanan. Untuk informasi lebih detail, silakan baca syarat dan ketentuan penggunaan pada halaman produk atau hubungi tim support kami."
          />
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