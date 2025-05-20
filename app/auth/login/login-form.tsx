'use client';

import { useState, useEffect, useRef } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiMail, FiLock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import SmartCaptcha from '../register/captcha';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordShaking, setIsPasswordShaking] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [showCaptchaSuccess, setShowCaptchaSuccess] = useState(false);
  
  // Refs untuk mencegah toast muncul berulang kali
  const registeredToastShown = useRef(false);
  const loginSuccessToastShown = useRef(false);

  // Cek apakah ada parameter registrasi sukses
  useEffect(() => {
    const registered = searchParams.get('registered');
    const callbackUrl = searchParams.get('callbackUrl');
    
    if (registered === 'true' && !registeredToastShown.current) {
      setSuccess('Pendaftaran berhasil! Silakan masuk dengan akun Anda.');
      toast({
        title: 'Pendaftaran Berhasil',
        description: 'Silakan masuk dengan akun Anda yang baru dibuat',
        variant: 'success',
        duration: 5000
      });
      registeredToastShown.current = true;
    }
    
    // Redirect jika sudah login
    if (status === 'authenticated' && !loginSuccessToastShown.current) {
      loginSuccessToastShown.current = true;
      
      // Jika pengguna adalah admin, arahkan ke dashboard admin
      if (session?.user?.role === 'ADMIN') {
        toast({
          title: 'Login Berhasil',
          description: 'Selamat datang di dashboard Admin',
          variant: 'success'
        });
        router.push('/admin');
      } else {
        // Untuk pengguna non-admin, gunakan callbackUrl atau default ke dashboard
        toast({
          title: 'Login Berhasil',
          description: 'Selamat datang kembali',
          variant: 'success'
        });
        router.push(callbackUrl || '/dashboard');
      }
    }
  // Hapus toast dari dependency array untuk mencegah infinite loop
  }, [searchParams, status, router, session]);

  const handleCaptchaVerify = (verified: boolean) => {
    console.log('CAPTCHA verification:', verified ? 'Success' : 'Failed');
    setCaptchaVerified(verified);
    
    if (verified) {
      // Tampilkan pesan sukses secara permanen sampai login berhasil atau gagal
      setShowCaptchaSuccess(true);
      toast({
        title: 'CAPTCHA Terverifikasi',
        description: 'Verifikasi CAPTCHA berhasil',
        variant: 'success',
        duration: 2000
      });
      
      // Tidak perlu lagi sembunyikan notifikasi setelah 3 detik
      // Pesan akan tetap tampil sampai form disubmit
    } else {
      setShowCaptchaSuccess(false);
      toast({
        title: 'CAPTCHA Gagal',
        description: 'Verifikasi CAPTCHA gagal, silakan coba lagi',
        variant: 'error',
        duration: 3000
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Email dan password harus diisi');
      toast({
        title: 'Input Tidak Lengkap',
        description: 'Email dan password harus diisi',
        variant: 'warning'
      });
      return;
    }
    
    if (!captchaVerified) {
      setError('Silakan selesaikan verifikasi CAPTCHA terlebih dahulu');
      toast({
        title: 'CAPTCHA Diperlukan',
        description: 'Silakan selesaikan verifikasi CAPTCHA terlebih dahulu',
        variant: 'warning'
      });
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      console.log('Attempting to sign in with credentials');
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });
      
      console.log('Sign in result:', JSON.stringify(result, null, 2));
      
      if (result?.error) {
        // Ganti pesan error default dengan pesan yang lebih jelas
        const errorMessage = result.error === 'CredentialsSignin' 
          ? 'Invalid Login. Email dan Password tidak sesuai. Silakan coba lagi.'
          : result.error;
          
        setError(errorMessage);
        setIsLoading(false);
        
        // Menampilkan animasi shake pada input password
        setIsPasswordShaking(true);
        setTimeout(() => setIsPasswordShaking(false), 820);
        
        // Reset CAPTCHA when login fails
        setCaptchaVerified(false);
        setShowCaptchaSuccess(false); // Hilangkan pesan sukses CAPTCHA saat login gagal
        
        // Menampilkan toast error
        toast({
          title: 'Login Gagal',
          description: errorMessage,
          variant: 'error',
          duration: 5000
        });
        
        return;
      }
      
      // Successful login - handled by the useEffect
      console.log('Login successful, waiting for session update');
    } catch (error) {
      console.error('Login error:', error);
      setError('Terjadi kesalahan. Silakan coba lagi.');
      setIsLoading(false);
      
      // Reset CAPTCHA when login encounters an error
      setCaptchaVerified(false);
      setShowCaptchaSuccess(false); // Hilangkan pesan sukses CAPTCHA saat terjadi error
      
      toast({
        title: 'Terjadi Kesalahan',
        description: 'Gagal terhubung ke server. Silakan coba lagi nanti',
        variant: 'error',
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">Masuk</h2>
              <p className="mt-2 text-sm text-gray-600">
                Masuk ke akun Anda untuk melanjutkan
              </p>
            </div>
          </CardHeader>
          
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center">
                <FiAlertCircle className="mr-2" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-center">
                <FiCheckCircle className="mr-2" />
                <span>{success}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="nama@email.com"
                  />
                </div>
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
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`appearance-none block w-full pl-10 pr-3 py-2 border ${isPasswordShaking ? 'border-red-500 animate-shake' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-200`}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Verifikasi CAPTCHA
                </label>
                <div className="mt-1">
                  <SmartCaptcha onVerify={handleCaptchaVerify} />
                </div>
                
                {showCaptchaSuccess && (
                  <div className="p-2 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-center text-sm">
                    <FiCheckCircle className="mr-2" />
                    <span>CAPTCHA was accepted</span>
                  </div>
                )}
              </div>

              <div>
                <Button
                  type="submit"
                  fullWidth
                  isLoading={isLoading}
                  disabled={isLoading || !captchaVerified}
                >
                  Masuk
                </Button>
              </div>
            </form>
          </CardContent>
          
          <CardFooter>
            <div className="text-center text-sm">
              <p className="text-gray-600">
                Belum punya akun?{' '}
                <Link href="/auth/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Daftar sekarang
                </Link>
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 