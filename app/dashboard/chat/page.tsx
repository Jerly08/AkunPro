'use client';

import { useState, useEffect, useRef } from 'react';
import { FiMessageCircle, FiSend, FiRefreshCw } from 'react-icons/fi';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import AuthGuard from '@/components/auth/AuthGuard';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type Message = {
  id: string;
  content: string;
  isFromAdmin: boolean;
  createdAt: string;
};

const UserChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.user) {
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
      const response = await fetch('/api/chat');
      const data = await response.json();

      if (data.success) {
        setMessages(data.messages || []);

        // Show notice if provided
        if (data.notice) {
          toast.success(data.notice);
        }

        // Show error if provided
        if (data.error) {
          toast.error(data.error);
        }
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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageInput.trim(),
        }),
      });

      const data = await response.json();

      if (data.success && data.message) {
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
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Pesan Saya</h1>

        <Card className="w-full">
          <CardHeader className="border-b bg-indigo-50">
            <CardTitle>
              <div className="flex items-center">
                <FiMessageCircle className="mr-2 h-5 w-5 text-indigo-600" />
                Obrolan dengan Admin
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {/* Messages Area */}
            <div className="h-[500px] overflow-y-auto p-4 bg-gray-50">
              {isLoading && messages.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <FiMessageCircle className="h-12 w-12 mb-2" />
                  <p>Belum ada pesan</p>
                  <p className="text-sm">Kirim pesan untuk memulai obrolan dengan admin</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isFromAdmin ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.isFromAdmin
                            ? 'bg-white border border-gray-200 text-gray-800'
                            : 'bg-indigo-600 text-white'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.isFromAdmin ? 'text-gray-500' : 'text-indigo-200'
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

            {/* Message Input */}
            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Ketik pesan Anda..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Button type="submit" disabled={!messageInput.trim() || isLoading}>
                  <FiSend className="mr-2 h-4 w-4" />
                  Kirim
                </Button>
              </form>
            </div>
          </CardContent>

          <CardFooter className="bg-gray-50 border-t px-4 py-3">
            <div className="flex justify-between items-center w-full">
              <p className="text-sm text-gray-500">
                Pesan dari form kontak juga akan muncul di sini
              </p>
              <button
                onClick={fetchMessages}
                className="flex items-center text-indigo-600 hover:text-indigo-800"
              >
                <FiRefreshCw className="mr-1 h-4 w-4" />
                Refresh
              </button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </AuthGuard>
  );
};

export default UserChatPage; 