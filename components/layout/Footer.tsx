import Link from 'next/link';
import { FiInstagram, FiTwitter, FiFacebook } from 'react-icons/fi';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">AkunPro Stream</h3>
            <p className="text-gray-300 text-sm">
              Platform jual beli akun premium Netflix dan Spotify dengan harga terjangkau dan terpercaya.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Tautan</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/account?type=NETFLIX" className="text-gray-300 hover:text-white">
                  Netflix
                </Link>
              </li>
              <li>
                <Link href="/account?type=SPOTIFY" className="text-gray-300 hover:text-white">
                  Spotify
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="text-gray-300 hover:text-white">
                  Masuk
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="text-gray-300 hover:text-white">
                  Daftar
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Hubungi Kami</h3>
            <div className="flex space-x-4 mb-4">
              <a href="#" className="text-gray-300 hover:text-white">
                <FiInstagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                <FiTwitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                <FiFacebook className="h-6 w-6" />
              </a>
            </div>
            <p className="text-gray-300 text-sm">
              Email: support@akunpromarketplace.com
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-300">
          <p>&copy; {currentYear} NS Marketplace. Hak Cipta Dilindungi.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 