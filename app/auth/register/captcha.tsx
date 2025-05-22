'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import dynamic from 'next/dynamic';

// Import Google reCAPTCHA secara dinamis
const ReCAPTCHA = dynamic(() => import('react-google-recaptcha'), {
  ssr: false,
  loading: () => <div className="p-3 text-center text-sm">Memuat CAPTCHA...</div>
});

// Komponen CAPTCHA yang menggunakan Google reCAPTCHA dengan fallback ke CAPTCHA matematika
export default function SmartCaptcha({ onVerify, resetKey = 0 }) {
  const [useLocalCaptcha, setUseLocalCaptcha] = useState(false);
  const [captchaLoadError, setCaptchaLoadError] = useState(false);
  const [captchaKey] = useState(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI');
  const [recaptchaKey, setRecaptchaKey] = useState(0);
  const [lastVerificationResult, setLastVerificationResult] = useState(false);
  const lastResetTimeRef = useRef(0);
  const verifyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onVerifyRef = useRef(onVerify);
  
  // Keep the onVerify function reference updated without triggering effect reruns
  useEffect(() => {
    onVerifyRef.current = onVerify;
  }, [onVerify]);
  
  // Cleanup any pending verification timeouts on unmount
  useEffect(() => {
    return () => {
      if (verifyTimeoutRef.current) {
        clearTimeout(verifyTimeoutRef.current);
      }
    };
  }, []);
  
  // Reset reCAPTCHA when resetKey changes
  useEffect(() => {
    if (resetKey > 0) {
      const now = Date.now();
      // Prevent multiple resets within 1 second
      if (now - lastResetTimeRef.current > 1000) {
        // Instead of using ref.reset(), we unmount and remount the component
        setRecaptchaKey(prev => prev + 1);
        
        // Clear any pending verification timeouts
        if (verifyTimeoutRef.current) {
          clearTimeout(verifyTimeoutRef.current);
          verifyTimeoutRef.current = null;
        }
        
        // Also tell the parent component that verification is now false
        if (lastVerificationResult) {
          setLastVerificationResult(false);
          onVerifyRef.current(false);
        }
        
        lastResetTimeRef.current = now;
      } else {
        console.log('Debouncing captcha reset - too many resets in short time');
      }
    }
  }, [resetKey, lastVerificationResult]);
  
  // Memoize the handler to avoid creating new function references
  const handleVerification = useCallback((token: string | null) => {
    // Clear any pending verification timeouts
    if (verifyTimeoutRef.current) {
      clearTimeout(verifyTimeoutRef.current);
      verifyTimeoutRef.current = null;
    }
    
    // Only process verification if the token exists
    if (token === null) return;
    
    const isVerified = Boolean(token);
    setLastVerificationResult(isVerified);
    
    // Use timeout to debounce and prevent race conditions
    verifyTimeoutRef.current = setTimeout(() => {
      // Use the ref to the latest onVerify function
      onVerifyRef.current(isVerified);
      verifyTimeoutRef.current = null;
    }, 100);
  }, []);
  
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
    <LocalCaptcha onVerify={onVerify} resetKey={resetKey} />
  ) : (
    <div className="flex flex-col items-center w-full overflow-x-auto">
      <div className="transform scale-90 origin-left sm:scale-100">
        <ReCAPTCHA
          key={recaptchaKey} // Use key for remounting
          sitekey={captchaKey}
          onChange={handleVerification}
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
export const LocalCaptcha = ({ onVerify, resetKey = 0 }) => {
  const [answer, setAnswer] = useState('');
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, operator: '+', answer: 0 });
  const [verificationAttempt, setVerificationAttempt] = useState(0);
  const [isError, setIsError] = useState(false);
  const lastResetTimeRef = useRef(0);
  const currentCaptchaRef = useRef(captcha);
  
  // Keep current captcha in ref for verification logic
  useEffect(() => {
    currentCaptchaRef.current = captcha;
  }, [captcha]);
  
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
    
    const newCaptcha = { num1, num2, operator, answer };
    setCaptcha(newCaptcha);
    currentCaptchaRef.current = newCaptcha;
    setAnswer('');
    setIsError(false);
  };
  
  // Generate captcha on component mount
  useEffect(() => {
    generateCaptcha();
  }, []);
  
  // Regenerate captcha when resetKey changes
  useEffect(() => {
    if (resetKey > 0) {
      const now = Date.now();
      // Prevent multiple resets within 1 second
      if (now - lastResetTimeRef.current > 1000) {
        generateCaptcha();
        onVerify(false);
        lastResetTimeRef.current = now;
      } else {
        console.log('Debouncing math captcha reset - too many resets in short time');
      }
    }
  }, [resetKey, onVerify]);
  
  const handleVerify = () => {
    setVerificationAttempt(prev => prev + 1);
    
    if (answer.trim() === '') {
      setIsError(true);
      return;
    }
    
    const userAnswer = parseInt(answer, 10);
    if (userAnswer === currentCaptchaRef.current.answer) {
      setIsError(false);
      onVerify(true);
    } else {
      setIsError(true);
      onVerify(false);
      
      // Generate new captcha on wrong answer
      setTimeout(() => {
        generateCaptcha();
      }, 1000);
    }
  };
  
  // Add enter key handler for the input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleVerify();
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
            onKeyPress={handleKeyPress}
            placeholder="Jawaban"
            className={`w-full border ${isError ? 'border-red-300' : 'border-gray-300'} rounded-md p-2 text-center text-base`}
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
        {isError && (
          <p className="text-sm text-red-600 self-start">Jawaban tidak tepat. Silakan coba lagi.</p>
        )}
      </div>
    </div>
  );
}; 