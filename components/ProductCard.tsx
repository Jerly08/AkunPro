import Link from 'next/link';

type ProductCardProps = {
  id: string;
  type: string;
  price: number;
  description: string;
  warranty: number;
  isPopular?: boolean;
}

export default function ProductCard({ id, type, price, description, warranty, isPopular }: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
  
  const typeColor = type === 'NETFLIX' ? 'text-red-600' : 'text-green-600';
  const typeBgColor = type === 'NETFLIX' ? 'bg-red-100' : 'bg-green-100';
  
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden relative">
      {isPopular && (
        <div className="absolute top-0 right-0 bg-accent text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
          POPULER
        </div>
      )}
      
      <div className="p-6">
        <div className={`w-12 h-12 ${typeBgColor} rounded-lg flex items-center justify-center mb-4`}>
          {type === 'NETFLIX' ? (
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 2.69127C5 1.93067 5.81547 1.44851 6.48192 1.81506L20.4069 9.23868C21.1249 9.63201 21.1249 10.3666 20.4069 10.7612L6.48192 18.1848C5.81546 18.5514 5 18.0691 5 17.3086V2.69127Z" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.5 16.5C16.5 16.5 15 18 12 18C9 18 7.5 16.5 7.5 16.5C7.5 16.5 9 15 12 15C15 15 16.5 16.5 16.5 16.5ZM16.5 12C16.5 12 15 13.5 12 13.5C9 13.5 7.5 12 7.5 12C7.5 12 9 10.5 12 10.5C15 10.5 16.5 12 16.5 12ZM16.5 7.5C16.5 7.5 15 9 12 9C9 9 7.5 7.5 7.5 7.5C7.5 7.5 9 6 12 6C15 6 16.5 7.5 16.5 7.5Z" />
            </svg>
          )}
        </div>
        
        <h3 className={`text-lg font-semibold ${typeColor} mb-2`}>
          {type}
        </h3>
        
        <p className="text-gray-text text-sm mb-4">{description}</p>
        
        <div className="flex items-baseline mb-4">
          <span className="text-xl font-bold text-primary">{formattedPrice}</span>
          <span className="text-xs text-gray-text ml-2">/bulan</span>
        </div>
        
        <div className="flex items-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-gray-text">Garansi {warranty} hari</span>
        </div>
      </div>
      
      <div className="flex border-t border-gray-100">
        <Link 
          href={`/product/${id}`}
          className="w-1/2 py-3 text-center text-sm font-medium text-primary hover:bg-gray-50 transition-colors duration-200"
        >
          Detail
        </Link>
        <button 
          className="w-1/2 py-3 text-center text-sm font-medium text-white bg-primary hover:bg-primary-dark transition-colors duration-200"
        >
          Tambah ke Cart
        </button>
      </div>
    </div>
  );
} 