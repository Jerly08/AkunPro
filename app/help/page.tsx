'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { 
  FiUser, 
  FiShoppingBag, 
  FiCreditCard, 
  FiHelpCircle, 
  FiHome,
  FiChevronDown,
  FiChevronUp,
  FiMail,
  FiMessageCircle,
  FiInfo
} from 'react-icons/fi';
import Button from '@/components/ui/Button';
import AuthGuard from '@/components/auth/AuthGuard';
import Image from 'next/image';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from '@/components/ui/Card';

interface FaqItem {
  question: string;
  answer: string;
}

export default function HelpPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('help');
  const [openFaqIndex, setOpenFaqIndex] = useState<number>(-1);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const faqItems: FaqItem[] = [
    {
      question: 'Bagaimana cara membeli akun premium?',
      answer: 'Anda dapat membeli akun premium dengan memilih produk yang diinginkan, klik tombol "Tambah ke Cart", lalu selesaikan proses checkout. Setelah pembayaran berhasil, akun akan langsung Anda terima.'
    },
    {
      question: 'Apa metode pembayaran yang diterima?',
      answer: 'Kami menerima berbagai metode pembayaran seperti transfer bank, e-wallet (OVO, GoPay, DANA), dan kartu kredit.'
    },
    {
      question: 'Berapa lama garansi akun premium?',
      answer: 'Setiap akun premium memiliki masa garansi yang berbeda, biasanya berkisar antara 30 hari hingga 1 tahun tergantung paket yang Anda pilih. Informasi garansi tertera jelas pada halaman produk.'
    },
    {
      question: 'Bagaimana jika akun yang saya beli bermasalah?',
      answer: 'Jika akun yang Anda beli mengalami masalah selama masa garansi, silakan hubungi kami melalui form di bawah ini atau email ke support@akunpro.com. Kami akan mengganti akun tersebut dengan yang baru.'
    },
    {
      question: 'Berapa lama akun akan aktif setelah pembelian?',
      answer: 'Akun akan segera aktif setelah pembayaran berhasil diverifikasi. Informasi akun akan dikirimkan ke email Anda atau dapat diakses di halaman "Pesanan Saya".'
    },
    {
      question: 'Bagaimana cara menggunakan akun premium?',
      answer: 'Setelah menerima informasi akun, Anda dapat login ke layanan streaming terkait (Netflix, Spotify, dll) menggunakan email dan password yang diberikan. Untuk petunjuk lebih detail, silakan lihat panduan penggunaan di halaman Bantuan.'
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? -1 : index);
  };

  const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    // Validasi form
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      setSubmitMessage({
        type: 'error',
        text: 'Semua field harus diisi'
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Kirim data ke API
      const response = await fetch('/api/help/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactForm),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Terjadi kesalahan saat mengirim pesan');
      }
      
      const data = await response.json();
      
      setSubmitMessage({
        type: 'success',
        text: data.message || 'Pesan Anda berhasil dikirim. Tim kami akan segera menghubungi Anda melalui sistem chat.'
      });
      
      // Reset form
      setContactForm({
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Error sending contact message:', error);
      setSubmitMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengirim pesan. Silakan coba lagi.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tampilan sidebar navigasi
  const SidebarNav = () => (
    <aside className="w-full md:w-64 md:flex-shrink-0">
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative h-12 w-12">
            <Image
              src={session?.user?.image || '/images/avatar-placeholder.svg'}
              alt={session?.user?.name || 'User'}
              className="rounded-full object-cover"
              fill
              sizes="48px"
            />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{session?.user?.name}</h3>
            <p className="text-xs text-gray-500">{session?.user?.email}</p>
          </div>
        </div>
        
        <nav className="space-y-1">
          <Link 
            href="/profile"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
          >
            <FiUser className="mr-3 h-5 w-5" />
            Profil Saya
          </Link>
          
          <Link 
            href="/orders"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
          >
            <FiShoppingBag className="mr-3 h-5 w-5" />
            Pesanan Saya
          </Link>
          
          <Link 
            href="/payments"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
          >
            <FiCreditCard className="mr-3 h-5 w-5" />
            Pembayaran
          </Link>
          
          <Link 
            href="/help"
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              activeTab === 'help' 
                ? 'bg-primary text-white' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('help')}
          >
            <FiHelpCircle className="mr-3 h-5 w-5" />
            Bantuan
          </Link>
        </nav>
      </div>
    </aside>
  );

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Pusat Bantuan</h1>
          <nav className="flex space-x-4">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 flex items-center">
              <FiHome className="mr-1" /> Beranda
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-sm text-gray-700">Bantuan</span>
          </nav>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          <SidebarNav />
          
          <div className="flex-1">
            {/* FAQ Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center">
                    <FiInfo className="mr-2 h-5 w-5 text-primary" />
                    Pertanyaan yang Sering Diajukan
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {faqItems.map((faq, index) => (
                    <div 
                      key={index} 
                      className="border border-gray-200 rounded-md overflow-hidden"
                    >
                      <button 
                        className="w-full flex justify-between items-center p-4 text-left font-medium focus:outline-none hover:bg-gray-50"
                        onClick={() => toggleFaq(index)}
                      >
                        <span>{faq.question}</span>
                        {openFaqIndex === index ? 
                          <FiChevronUp className="h-5 w-5 text-gray-500" /> : 
                          <FiChevronDown className="h-5 w-5 text-gray-500" />
                        }
                      </button>
                      {openFaqIndex === index && (
                        <div className="px-4 pb-4 text-gray-700">
                          <p>{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center">
                    <FiMessageCircle className="mr-2 h-5 w-5 text-primary" />
                    Hubungi Kami
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  Jika Anda memiliki pertanyaan yang tidak terjawab di atas atau mengalami masalah dengan akun yang dibeli, silakan isi form di bawah ini. Tim kami akan merespons dalam waktu 24 jam kerja. Pesan Anda juga akan tersedia di sistem chat untuk komunikasi lebih lanjut.
                </p>
                
                {submitMessage && (
                  <div className={`mb-6 p-4 rounded-md ${
                    submitMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                    {submitMessage.text}
                    {submitMessage.type === 'success' && (
                      <div className="mt-2">
                        <Link 
                          href="/dashboard/chat" 
                          className="inline-flex items-center text-primary font-medium hover:underline"
                        >
                          <FiMessageCircle className="mr-1 h-4 w-4" />
                          Buka sistem chat untuk melihat balasan
                        </Link>
                      </div>
                    )}
                  </div>
                )}
                
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      Subjek
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={contactForm.subject}
                      onChange={handleContactFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                      placeholder="Misalnya: Pertanyaan tentang akun Netflix"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Pesan
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={contactForm.message}
                      onChange={handleContactFormChange}
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                      placeholder="Jelaskan masalah atau pertanyaan Anda secara detail..."
                    ></textarea>
                  </div>
                  
                  <div className="pt-4">
                    <Button
                      type="submit"
                      isLoading={isSubmitting}
                      disabled={isSubmitting}
                      className="w-full md:w-auto"
                    >
                      <FiMail className="mr-2 h-4 w-4" />
                      Kirim Pesan
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Alternative Contact Methods */}
            <div className="mt-6 bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Kontak Alternatif</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <FiMessageCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900">Chat System</h4>
                    <Link href="/dashboard/chat" className="text-blue-600 hover:underline">Lihat dan balas pesan</Link>
                    <p className="text-xs text-gray-500 mt-1">Metode kontak yang direkomendasikan</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <FiMail className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900">Email</h4>
                    <p className="text-gray-600">support@akunpro.com</p>
                    <p className="text-xs text-gray-500 mt-1">Respons dalam 24 jam kerja</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900">WhatsApp</h4>
                    <p className="text-gray-600">+62 812-3456-7890</p>
                    <p className="text-xs text-gray-500 mt-1">Jam operasional: 09.00 - 18.00 WIB</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 