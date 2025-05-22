'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { FiUser, FiMail, FiLock, FiAlertCircle, FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SmartCaptcha from './captcha';

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [showCaptchaSuccess, setShowCaptchaSuccess] = useState(false);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    captcha?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Redirect jika sudah login
  useEffect(() => {
    if (status === 'authenticated') {
      const callbackUrl = searchParams.get('callbackUrl');
      router.push(callbackUrl || '/dashboard');
    }
  }, [status, router, searchParams]);

  const validateForm = () => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      captcha?: string;
    } = {};
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = 'Nama harus diisi';
      isValid = false;
    }

    if (!email.trim()) {
      newErrors.email = 'Email harus diisi';
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'Format email tidak valid';
        isValid = false;
      }
    }

    if (!password) {
      newErrors.password = 'Password harus diisi';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
      isValid = false;
    } else {
      // Validate strong password (min 8 chars, uppercase, lowercase, number, symbol)
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!strongPasswordRegex.test(password)) {
        newErrors.password = 'Password harus minimal 8 karakter dan mengandung huruf besar, huruf kecil, angka, dan simbol';
        isValid = false;
      }
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Password dan konfirmasi password tidak cocok';
      isValid = false;
    }

    // Only add captcha error if not verified, but don't reset the captcha state
    if (!captchaVerified) {
      newErrors.captcha = 'Silakan verifikasi captcha';
      isValid = false;
    }

    // Update errors state
    setErrors(newErrors);
    
    // Don't reset captcha during validation - this causes problems
    // We'll only reset captcha after API errors, not validation errors
    
    return isValid;
  };

  const handleCaptchaVerify = (verified: boolean) => {
    console.log('CAPTCHA verification:', verified ? 'Success' : 'Failed');
    setCaptchaVerified(verified);
    if (verified) {
      setShowCaptchaSuccess(true);
      setErrors(prev => ({ ...prev, captcha: undefined }));
    } else {
      setShowCaptchaSuccess(false);
      // Only show error if explicitly failed (not just reset)
      if (captchaResetKey > 0) {
        setErrors(prev => ({ ...prev, captcha: 'Verifikasi CAPTCHA gagal. Silakan coba lagi.' }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Store captcha verification state before validation could potentially modify it
    const wasCaptchaVerified = captchaVerified;
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      setErrors({});
      
      // Verify captcha is still valid (may have been reset by validation)
      if (!wasCaptchaVerified) {
        setErrors({ captcha: 'Silakan verifikasi captcha' });
        setIsLoading(false);
        return;
      }
      
      // Attempt to register with retry logic
      let attemptCount = 0;
      const maxAttempts = 3;
      let success = false;
      let lastError = null;
      
      while (attemptCount < maxAttempts && !success) {
        try {
          attemptCount++;
          console.log(`Registration attempt ${attemptCount}/${maxAttempts}`);
          
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name,
              email,
              password,
              captchaToken: 'smart-captcha-verified', // Token khusus untuk SmartCaptcha
            }),
          });
          
          // Handle possible empty response or invalid JSON
          let data;
          try {
            data = await response.json();
          } catch (jsonError) {
            console.error('Failed to parse JSON response:', jsonError);
            throw new Error('Kesalahan server: Respons tidak valid');
          }
          
          if (!response.ok) {
            // Check for email already registered case
            if (response.status === 400 && data?.message?.includes('Email sudah terdaftar')) {
              // Don't log this as an error, it's an expected user flow
              console.log('Registration attempt with existing email:', email);
              throw new Error(data.message);
            } else {
              // Log other errors as actual errors
              console.error('Registration error:', JSON.stringify({
                status: response.status,
                statusText: response.statusText,
                message: data?.message
              }));
              
              // Check for specific error types and provide better error messages
              if (response.status === 400) {
                if (data?.message === 'Registrasi tidak berhasil') {
                  // Legacy error for duplicate email
                  throw new Error('Email sudah terdaftar. Silakan gunakan email lain.');
                } else if (data?.message) {
                  throw new Error(data.message);
                } else {
                  throw new Error('Terjadi kesalahan saat mendaftar. Silakan coba lagi.');
                }
              }
            }
          }
          
          // If we get here, registration was successful
          success = true;
          console.log('Registration successful, redirecting to login page');
          router.push('/auth/login?registered=true');
          return;
        } catch (attemptError) {
          lastError = attemptError;
          console.error(`Registration attempt ${attemptCount} failed:`, attemptError);
          
          // Only retry for server errors, not for validation errors
          if (attemptError.message.includes('Email sudah terdaftar')) {
            // Don't retry for duplicate email errors
            break;
          }
          
          // Wait before retrying (only if not the last attempt)
          if (attemptCount < maxAttempts) {
            const delay = attemptCount * 1000; // Increase delay with each retry
            console.log(`Retrying in ${delay/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      // If we exhausted all attempts without success
      if (!success && lastError) {
        throw lastError;
      }
    } catch (error: any) {
      console.error('Final registration error:', error);
      
      // Show clear error message on the form
      if (error.message.includes('Email sudah terdaftar')) {
        // Special handling for duplicate email - keep everything else working
        setErrors({
          general: error.message,
          email: 'Email sudah terdaftar'  // Add email-specific error too
        });
        // Don't reset captcha for duplicate email errors
        // Just keep the form as-is so user can change the email and submit again
      } else {
        // For other errors, reset more aggressively
        setErrors({
          general: error.message || 'Terjadi kesalahan. Silakan coba lagi.'
        });
        
        // Reset captcha on error but avoid continuous regeneration
        setCaptchaVerified(false);
        setShowCaptchaSuccess(false);
        
        // Only increment captcha reset key for specific error conditions
        if (error.message.includes('captcha')) {
          // Reset captcha for captcha-related errors
          setCaptchaResetKey(prev => prev + 1);
        } else if (captchaResetKey === 0) {
          // Reset captcha only once for other errors
          setCaptchaResetKey(1);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-6 px-3 sm:py-12 sm:px-6">
        <div className="w-full max-w-[340px] sm:max-w-md">
          <Card className="shadow-lg">
            <CardHeader className="px-4 py-5 sm:px-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Daftar</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Buat akun baru untuk mulai berbelanja
                </p>
              </div>
            </CardHeader>
            
            <CardContent className="px-4 sm:px-6">
              {errors.general && (
                <div className={`mb-4 p-3 ${errors.general.includes('Email sudah terdaftar') ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-red-50 border-red-200 text-red-700'} border rounded-md flex items-center text-sm`}>
                  <FiAlertCircle className="mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{errors.general}</p>
                    {errors.general.includes('Email sudah terdaftar') && (
                      <p className="mt-1 text-xs">
                        Anda sudah memiliki akun? <Link href="/auth/login" className="font-medium underline">Login disini</Link>
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nama Lengkap
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`appearance-none block w-full pl-10 pr-3 py-3 border ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm`}
                      placeholder="John Doe"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`appearance-none block w-full pl-10 pr-3 py-3 border ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm`}
                      placeholder="nama@email.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`appearance-none block w-full pl-10 pr-12 py-3 border ${
                        errors.password ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm`}
                      placeholder="******"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <FiEyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <FiEye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.password ? (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">
                      Password harus minimal 8 karakter dan mengandung huruf besar, huruf kecil, angka, dan simbol.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Konfirmasi Password
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`appearance-none block w-full pl-10 pr-3 py-3 border ${
                        errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base sm:text-sm`}
                      placeholder="******"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Verifikasi CAPTCHA
                  </label>
                  <div className="mt-1">
                    <SmartCaptcha onVerify={handleCaptchaVerify} resetKey={captchaResetKey} />
                  </div>
                  
                  {showCaptchaSuccess && (
                    <div className="p-2 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-center text-sm">
                      <FiCheckCircle className="mr-2" />
                      <span>CAPTCHA was accepted</span>
                    </div>
                  )}

                  {errors.captcha && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FiAlertCircle className="mr-1" />
                      {errors.captcha}
                    </p>
                  )}
                </div>

                <div>
                  <Button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Mendaftar...' : 'Daftar'}
                  </Button>
                </div>
              </form>
            </CardContent>
            
            <CardFooter className="flex justify-center border-t border-gray-200 p-4 text-center">
              <p className="text-sm text-gray-600">
                Sudah punya akun?{' '}
                <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Masuk
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
} 