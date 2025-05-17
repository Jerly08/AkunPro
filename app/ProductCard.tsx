import Link from 'next/link';
import { FiPlay, FiMusic, FiShield, FiCheck, FiArrowRight } from 'react-icons/fi';

interface ProductCardProps {
  type: 'NETFLIX' | 'SPOTIFY';
  title: string;
  description: string;
  price: number;
  features: string[];
  ctaText?: string;
  ctaLink: string;
}

const ProductCard = ({
  type,
  title,
  description,
  price,
  features,
  ctaText = 'Lihat Paket',
  ctaLink
}: ProductCardProps) => {
  const isNetflix = type === 'NETFLIX';
  const bgColor = isNetflix ? 'from-red-500 to-red-700' : 'from-green-500 to-green-700';
  const hoverColor = isNetflix ? 'hover:bg-red-700' : 'hover:bg-green-700';
  const buttonColor = isNetflix ? 'bg-red-600' : 'bg-green-600';
  const icon = isNetflix ? <FiPlay className="h-5 w-5 sm:h-6 sm:w-6 text-white" /> : <FiMusic className="h-5 w-5 sm:h-6 sm:w-6 text-white" />;

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg transition-transform hover:transform hover:scale-[1.02]">
      <div className={`bg-gradient-to-r ${bgColor} p-4 sm:p-6`}>
        <div className="flex items-center justify-between">
          <h3 className="text-xl sm:text-2xl font-bold text-white">{title}</h3>
          {icon}
        </div>
      </div>
      <div className="p-4 sm:p-6">
        <p className="text-gray-700 mb-4 text-sm sm:text-base">{description}</p>
        <ul className="mb-5 sm:mb-6 space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <FiCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 mt-0.5" />
              <span className="text-gray-700 text-sm sm:text-base">{feature}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <span className="block text-xs sm:text-sm text-gray-500">Mulai dari</span>
            <span className="text-xl sm:text-2xl font-bold text-gray-900">Rp {price.toLocaleString('id-ID')}</span>
          </div>
          <Link href={ctaLink} className={`inline-flex items-center justify-center px-4 py-2 ${buttonColor} text-white text-sm font-semibold rounded-md ${hoverColor} transition-colors`}>
            {ctaText} <FiArrowRight className="ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard; 