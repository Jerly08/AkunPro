import Link from 'next/link';
import Image from 'next/image';
import { FiPlay, FiMusic, FiArrowRight } from 'react-icons/fi';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-white to-gray-light py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-dark leading-tight mb-6">
                Akses Premium, <br className="hidden sm:block" />
                Harga Terjangkau
              </h1>
              <p className="text-lg text-gray-text mb-8 max-w-lg">
                Akunpro menyediakan akun premium berkualitas dengan jaminan layanan terbaik untuk kebutuhan digital Anda
              </p>
              <div className="flex flex-wrap gap-4 mb-12">
                <Link 
                  href="/accounts" 
                  className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition duration-200"
                >
                  Jelajahi Sekarang
                </Link>
                {/* <Link 
                  href="/how-it-works" 
                  className="px-6 py-3 border border-gray-300 text-dark font-semibold rounded-lg hover:bg-gray-50 transition duration-200"
                >
                  Pelajari Lebih Lanjut
                </Link> */}
              </div>
            
              <div className="flex flex-wrap gap-12">
                <div>
                  <p className="text-2xl font-bold text-primary">50k+</p>
                  <p className="text-sm text-gray-text">Pengguna</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">99%</p>
                  <p className="text-sm text-gray-text">Tingkat Kepuasan</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">24/7</p>
                  <p className="text-sm text-gray-text">Dukungan</p>
                </div>
              </div>
            </div>
            
            <div className="md:w-1/2 flex justify-center">
              <Image 
                src="/images/hero-illustration.svg" 
                alt="Akunpro illustration" 
                width={500} 
                height={400}
                className="max-w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Keunggulan Section */}
      <section className="mb-16">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
          Mengapa Memilih Kami?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-lg shadow-md text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Garansi Penuh</h3>
            <p className="text-gray-600">
              Kami memberikan garansi penuh selama masa berlaku akun, jika akun bermasalah kami ganti dengan yang baru.
            </p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow-md text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Harga Terjangkau</h3>
            <p className="text-gray-600">
              Nikmati layanan premium dengan harga yang jauh lebih terjangkau dibandingkan berlangganan resmi.
            </p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow-md text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Aktivasi Instan</h3>
            <p className="text-gray-600">
              Setelah pembayaran berhasil, Anda akan langsung mendapatkan akses ke akun yang dibeli.
            </p>
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section id="products" className="mb-16">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
          Kategori Produk
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Netflix Card */}
          <div className="bg-white rounded-lg overflow-hidden shadow-lg transition-transform hover:transform hover:scale-[1.02]">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">Netflix Premium</h3>
                <FiPlay className="text-white h-8 w-8" />
              </div>
            </div>
            <div className="p-6">
              <ul className="mb-6 space-y-2">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-700">Akses tak terbatas ke ribuan film & serial TV</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-700">Streaming kualitas HD/4K tanpa iklan</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-700">Tersedia berbagai durasi langganan</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-700">Garansi penuh selama masa aktif</span>
                </li>
              </ul>
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-sm text-gray-500">Mulai dari</span>
                  <span className="text-2xl font-bold text-gray-900">Rp 45.000</span>
                </div>
                <Link 
                  href="/account?type=NETFLIX" 
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors"
                >
                  Lihat Akun <FiArrowRight className="ml-2" />
                </Link>
              </div>
            </div>
          </div>

          {/* Spotify Card */}
          <div className="bg-white rounded-lg overflow-hidden shadow-lg transition-transform hover:transform hover:scale-[1.02]">
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">Spotify Premium</h3>
                <FiMusic className="text-white h-8 w-8" />
              </div>
            </div>
            <div className="p-6">
              <ul className="mb-6 space-y-2">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-700">Dengarkan musik tanpa iklan</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-700">Download musik untuk didengarkan offline</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-700">Kualitas audio superior</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-700">Tersedia paket individu dan family</span>
                </li>
              </ul>
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-sm text-gray-500">Mulai dari</span>
                  <span className="text-2xl font-bold text-gray-900">Rp 35.000</span>
                </div>
                <Link 
                  href="/account?type=SPOTIFY" 
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors"
                >
                  Lihat Akun <FiArrowRight className="ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mb-16">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
          Apa Kata Pelanggan Kami
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="flex items-center space-x-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-gray-600 mb-4">
              "Saya sudah berlangganan Netflix Premium selama 6 bulan dan belum pernah ada masalah. Harganya jauh lebih murah dan customer service-nya sangat responsif."
            </p>
            <div className="font-semibold">Budi Santoso</div>
            <div className="text-sm text-gray-500">Jakarta</div>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="flex items-center space-x-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-gray-600 mb-4">
              "Spotify Premium dari sini sangat worth it! Bisa download lagu sepuasnya, dan ketika pernah ada masalah login, langsung diganti akun baru dalam hitungan jam."
            </p>
            <div className="font-semibold">Dewi Anggraini</div>
            <div className="text-sm text-gray-500">Surabaya</div>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="flex items-center space-x-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-gray-600 mb-4">
              "Awalnya ragu, tapi setelah dipakai ternyata Netflix-nya beneran premium. Garansi juga berjalan lancar, pernah di-reset password dan langsung diganti dengan yang baru."
            </p>
            <div className="font-semibold">Ahmad Faisal</div>
            <div className="text-sm text-gray-500">Bandung</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section>
        <div className="bg-indigo-50 rounded-xl p-8 md:p-10">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-indigo-800 mb-4">
              Siap Menikmati Hiburan Premium?
            </h2>
            <p className="text-indigo-600 mb-6 md:w-2/3 mx-auto">
              Dapatkan akun Netflix dan Spotify Premium hari ini dengan harga terbaik dan garansi penuh selama masa aktif.
            </p>
            <div className="flex flex-col md:flex-row justify-center gap-4">
              <Link
                href="/account?type=NETFLIX"
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                Beli Netflix Premium
              </Link>
              <Link
                href="/account?type=SPOTIFY"
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                Beli Spotify Premium
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
