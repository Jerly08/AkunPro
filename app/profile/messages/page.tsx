'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { FiSend, FiMessageCircle } from 'react-icons/fi';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AuthGuard from '@/components/auth/AuthGuard';

type Message = {
  id: string;
  content: string;
  isFromAdmin: boolean;
  createdAt: string;
  userId: string;
};

export default function UserMessagesPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (session?.user?.id) {
      fetchMessages();
    }
  }, [session]);
  
  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/messages');
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages);
      } else {
        toast.error(data.message || 'Gagal memuat pesan');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Gagal memuat pesan');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim()) return;
    
    try {
      const response = await fetch('/api/user/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageInput.trim(),
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessages(prev => [...prev, data.message]);
        setMessageInput('');
      } else {
        toast.error(data.message || 'Gagal mengirim pesan');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Gagal mengirim pesan');
    }
  };
  
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Pesan Saya</h1>
          <nav className="flex space-x-4">
            <Link href="/profile" className="text-sm text-gray-500 hover:text-gray-700">
              Profil
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-sm text-gray-700">Pesan</span>
          </nav>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Chat header */}
          <div className="p-4 border-b bg-indigo-50">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                <FiMessageCircle className="text-indigo-600" />
              </div>
              <div>
                <p className="font-medium">Dukungan AkunPro</p>
                <p className="text-sm text-gray-500">Riwayat pesan dengan tim support</p>
              </div>
            </div>
          </div>
          
          {/* Messages */}
          <div className="h-[50vh] overflow-y-auto p-4 bg-gray-50">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <FiMessageCircle className="text-gray-300 w-16 h-16 mb-4" />
                <p className="text-gray-500">Belum ada pesan</p>
                <p className="text-sm text-gray-400 mt-2">
                  Gunakan form di bawah untuk mengirim pesan ke tim support
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      !message.isFromAdmin ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-lg ${
                        !message.isFromAdmin
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border text-gray-800'
                      }`}
                    >
                      <p>{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          !message.isFromAdmin ? 'text-indigo-200' : 'text-gray-500'
                        }`}
                      >
                        {formatDateTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          {/* Message input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t bg-white">
            <div className="flex">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Ketik pesan..."
                className="flex-1 px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="bg-indigo-600 text-white px-6 py-2 rounded-r-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center disabled:bg-gray-300"
              >
                <FiSend className="mr-2" />
                Kirim
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
} 