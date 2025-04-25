'use client';

import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiMessageCircle, FiSend, FiRefreshCw } from 'react-icons/fi';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

type User = {
  id: string;
  name: string;
  email: string;
  image?: string;
  unreadCount: number;
};

type Message = {
  id: string;
  content: string;
  isFromAdmin: boolean;
  createdAt: string;
  userId: string;
};

const AdminChatPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: session } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      window.location.href = '/';
      return;
    }
    
    fetchUsers();
  }, [session]);
  
  useEffect(() => {
    if (selectedUserId) {
      fetchMessages(selectedUserId);
    }
  }, [selectedUserId]);
  
  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/chat/users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
        
        // Auto-select the first user if none is selected
        if (!selectedUserId && data.users.length > 0) {
          setSelectedUserId(data.users[0].id);
        }

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
      console.error('Error fetching users:', error);
      toast.error('Gagal memuat daftar pengguna');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchMessages = async (userId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/chat/messages?userId=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages);
        // Mark messages as read
        markMessagesAsRead(userId);
        
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
  
  const markMessagesAsRead = async (userId: string) => {
    try {
      await fetch('/api/admin/chat/mark-as-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      // Update the unread count for this user
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, unreadCount: 0 } : user
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !selectedUserId) return;
    
    try {
      const response = await fetch('/api/admin/chat/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUserId,
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
  
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Chat Pelanggan</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* Users List */}
        <div className="bg-white rounded-lg shadow overflow-hidden lg:col-span-1">
          <div className="p-4 border-b">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari pengguna..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          {isLoading && users.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="overflow-y-auto h-[calc(100vh-280px)]">
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Tidak ada pengguna ditemukan
                </div>
              ) : (
                <ul className="divide-y">
                  {filteredUsers.map((user) => (
                    <li 
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${
                        selectedUserId === user.id ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                            <span className="font-medium text-indigo-800">
                              {user.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        {user.unreadCount > 0 && (
                          <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                            {user.unreadCount}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          
          <div className="p-2 border-t bg-gray-50">
            <button
              onClick={fetchUsers}
              className="flex items-center justify-center w-full py-2 bg-white border rounded-lg hover:bg-gray-50 text-gray-600"
            >
              <FiRefreshCw className="mr-2" />
              Refresh
            </button>
          </div>
        </div>
        
        {/* Chat Area */}
        <div className="bg-white rounded-lg shadow overflow-hidden lg:col-span-3 flex flex-col">
          {selectedUserId ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b bg-indigo-50">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                    <FiMessageCircle className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {users.find(u => u.id === selectedUserId)?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {users.find(u => u.id === selectedUserId)?.email}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <FiMessageCircle className="text-gray-300 w-16 h-16 mb-4" />
                    <p className="text-gray-500">Belum ada pesan dari pengguna ini</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.isFromAdmin ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-3 rounded-lg ${
                            message.isFromAdmin
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white border text-gray-800'
                          }`}
                        >
                          <p>{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.isFromAdmin ? 'text-indigo-200' : 'text-gray-500'
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
                    placeholder="Ketik balasan..."
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
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <FiMessageCircle className="text-gray-300 w-20 h-20 mb-4" />
              <p className="text-gray-500">Pilih pengguna untuk memulai chat</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatPage; 