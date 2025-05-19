'use client';

import { useState, useEffect } from 'react';
import { FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import dynamic from 'next/dynamic';

// Import Google reCAPTCHA secara dinamis
const ReCAPTCHA = dynamic(() => import('react-google-recaptcha'), {
  ssr: false,
  loading: () => <div className="p-3 text-center text-sm">Memuat CAPTCHA...</div>
});

// Komponen CAPTCHA yang menggunakan Google reCAPTCHA dengan fallback ke CAPTCHA matematika
export default function SmartCaptcha({ onVerify }) {
  const [useLocalCaptcha, setUseLocalCaptcha] = useState(false);
  const [captchaLoadError, setCaptchaLoadError] = useState(false);
  const [captchaKey] = useState(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI');
  
  // Coba muat Google reCAPTCHA terlebih dahulu
  useEffect(() => {
    // Deteksi apakah browser mendukung Google reCAPTCHA
    const testRecaptchaLoad = () => {
      try {
        // Set timeout untuk deteksi jika script reCAPTCHA tidak dimuat dalam 3 detik
        const timeout = setTimeout(() => {
          console.log('reCAPTCHA load timeout - switching to local CAPTCHA');
          setUseLocalCaptcha(true);
        }, 3000);

        // Tambahkan event handler untuk script reCAPTCHA
        window.addEventListener('error', (event: ErrorEvent) => {
          const target = event.target as HTMLElement;
          if ((target && 
              (target.getAttribute('src') || '').includes('recaptcha')) || 
              (event.message || '').includes('recaptcha')) {
            console.log('reCAPTCHA load error - switching to local CAPTCHA');
            setCaptchaLoadError(true);
            setUseLocalCaptcha(true);
            clearTimeout(timeout);
          }
        }, true);
        
        return () => clearTimeout(timeout);
      } catch (err) {
        console.error('Error loading reCAPTCHA:', err);
        setUseLocalCaptcha(true);
        return () => {};
      }
    };
    
    testRecaptchaLoad();
  }, []);
  
  // Berikan CAPTCHA sesuai kondisi
  return useLocalCaptcha ? (
    <LocalCaptcha onVerify={onVerify} />
  ) : (
    <div className="flex flex-col items-center w-full overflow-x-auto">
      <div className="transform scale-90 origin-left sm:scale-100">
        <ReCAPTCHA
          sitekey={captchaKey}
          onChange={(token) => onVerify(token ? true : false)}
          onError={() => {
            setCaptchaLoadError(true); 
            setUseLocalCaptcha(true);
          }}
          theme="light"
          size="normal"
        />
      </div>
      {captchaLoadError && (
        <button 
          className="mt-2 text-sm text-blue-600 hover:underline"
          onClick={() => setUseLocalCaptcha(true)}
        >
          Gunakan CAPTCHA alternatif
        </button>
      )}
    </div>
  );
}

// CAPTCHA Matematika sebagai fallback
export const LocalCaptcha = ({ onVerify }) => {
  const [answer, setAnswer] = useState('');
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, operator: '+', answer: 0 });
  
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10);
    const num2 = Math.floor(Math.random() * 10);
    const operators = ['+', '-', '*'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    let answer;
    switch (operator) {
      case '+':
        answer = num1 + num2;
        break;
      case '-':
        answer = num1 - num2;
        break;
      case '*':
        answer = num1 * num2;
        break;
      default:
        answer = num1 + num2;
    }
    
    setCaptcha({ num1, num2, operator, answer });
    setAnswer('');
  };
  
  // Generate captcha on component mount
  useEffect(() => {
    generateCaptcha();
  }, []);
  
  const handleVerify = () => {
    if (parseInt(answer, 10) === captcha.answer) {
      onVerify(true);
    } else {
      onVerify(false);
      generateCaptcha();
    }
  };
  
  return (
    <div className="border border-gray-300 p-3 sm:p-4 rounded-md w-full">
      <div className="flex flex-col items-center space-y-3">
        <div className="text-sm font-medium text-gray-700">Verifikasi CAPTCHA</div>
        <div className="flex items-center justify-center text-lg sm:text-xl font-bold bg-gray-100 w-full py-3 rounded-md">
          {captcha.num1} {captcha.operator} {captcha.num2} = ?
        </div>
        <div className="w-full flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
          <input
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Jawaban"
            className="w-full border border-gray-300 rounded-md p-2 text-center text-base"
          />
          <div className="flex space-x-2">
            <button 
              type="button" 
              onClick={generateCaptcha}
              className="border border-gray-300 rounded-md p-2 hover:bg-gray-50 flex-shrink-0"
            >
              <FiRefreshCw />
            </button>
            <button 
              type="button"
              onClick={handleVerify}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex-grow sm:flex-grow-0"
            >
              Verifikasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 