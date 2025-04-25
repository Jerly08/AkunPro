'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { FiX, FiSend, FiChevronDown, FiChevronUp, FiHeadphones, FiMessageSquare } from 'react-icons/fi';
import { BiSupport } from 'react-icons/bi';
import Image from 'next/image';
import toast from 'react-hot-toast';

type Message = {
  id: string;
  content: string;
  isFromAdmin: boolean;
  createdAt: Date;
};

const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  // Helper function to save messages to sessionStorage
  const saveMessagesToStorage = (msgs: Message[]) => {
    try {
      if (typeof window !== 'undefined' && session?.user?.id) {
        const userId = session.user.id;
        sessionStorage.setItem(`chat_messages_${userId}`, JSON.stringify(
          msgs.map((m: Message) => ({...m, createdAt: m.createdAt.toISOString()}))
        ));
        console.log('[CHAT DEBUG] Saved messages to sessionStorage');
      }
    } catch (e) {
      console.error('[CHAT DEBUG] Failed to save to sessionStorage:', e);
    }
  };

  // Helper function to load messages from sessionStorage
  const loadMessagesFromStorage = (): Message[] | null => {
    try {
      if (typeof window !== 'undefined' && session?.user?.id) {
        const userId = session.user.id;
        const stored = sessionStorage.getItem(`chat_messages_${userId}`);
        if (stored) {
          const parsedMessages = JSON.parse(stored);
          const messagesWithDateObjects = parsedMessages.map((msg: any) => ({
            ...msg,
            createdAt: new Date(msg.createdAt)
          }));
          console.log('[CHAT DEBUG] Loaded messages from sessionStorage:', messagesWithDateObjects);
          return messagesWithDateObjects;
        }
      }
    } catch (e) {
      console.error('[CHAT DEBUG] Failed to load from sessionStorage:', e);
    }
    return null;
  };

  // Helper function to check for new admin messages
  const checkForNewAdminMessages = (newMessages: Message[], oldMessageCount: number) => {
    if (newMessages.length > oldMessageCount) {
      // Check if any of the new messages are from admin
      const newAdminMessages = newMessages.slice(oldMessageCount).filter(msg => msg.isFromAdmin);
      
      if (newAdminMessages.length > 0) {
        console.log('[CHAT DEBUG] New admin messages detected:', newAdminMessages);
        
        // Show toast notification using react-hot-toast (mirip dengan cart notification)
        newAdminMessages.forEach(msg => {
          toast.success(
            <div className="flex items-start">
              <FiMessageSquare className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Admin membalas pesan Anda</p>
                <p className="text-sm mt-1 truncate" style={{ maxWidth: '230px' }}>
                  {msg.content.length > 50 ? `${msg.content.substring(0, 50)}...` : msg.content}
                </p>
              </div>
            </div>, 
            {
              duration: 5000,
              position: 'top-center',
              style: {
                background: '#4F46E5',
                color: '#fff',
                padding: '16px',
                borderRadius: '8px',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#4F46E5',
              }
            }
          );
        });
        
        // If chat is closed, set indicator state to true
        if (!isOpen) {
          setHasNewMessage(true);
        }
      }
    }
    
    // Update the message count
    setLastMessageCount(newMessages.length);
  };

  // Reset new message indicator when chat is opened
  useEffect(() => {
    if (isOpen) {
      setHasNewMessage(false);
    }
  }, [isOpen]);

  // Polling for new messages
  useEffect(() => {
    // Only poll when the user is logged in and chat is not open
    if (session?.user && !isOpen) {
      const intervalId = setInterval(() => {
        fetchMessages();
      }, 30000); // Poll every 30 seconds
      
      return () => clearInterval(intervalId);
    }
  }, [session, isOpen]);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // For debugging
  useEffect(() => {
    console.log('[CHAT DEBUG] Current messages state:', messages);
    // Save messages to sessionStorage when they change
    if (messages.length > 0) {
      saveMessagesToStorage(messages);
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && session?.user) {
      // Try to load messages from sessionStorage first
      const storedMessages = loadMessagesFromStorage();
      if (storedMessages && storedMessages.length > 0) {
        console.log('[CHAT DEBUG] Using messages from sessionStorage');
        setMessages(storedMessages);
      }
      
      // Still fetch from server to get any new messages
      fetchMessages();
    }
  }, [isOpen, session]);

  const fetchMessages = async () => {
    if (!session?.user) return;
    
    try {
      setIsLoading(true);
      console.log('[CHAT DEBUG] Fetching messages from server');
      const response = await fetch('/api/chat');
      const data = await response.json();
      console.log('[CHAT DEBUG] Fetch response:', data);
      
      if (data.success) {
        // Convert string dates to Date objects
        const formattedMessages = data.messages.map((msg: any) => ({
          ...msg,
          createdAt: new Date(msg.createdAt)
        }));
        
        console.log('[CHAT DEBUG] Formatted messages with Date objects:', formattedMessages);
        
        // Check if there's a notice about chat service setup
        if (data.notice) {
          console.log('[CHAT DEBUG] Service notice detected:', data.notice);
          // Don't replace messages, just add the notice
          const hasNotice = messages.some(msg => msg.id === 'system-notice');
          if (!hasNotice) {
            setMessages(prev => [...prev, {
              id: 'system-notice',
              content: data.notice,
              isFromAdmin: true,
              createdAt: new Date()
            }]);
          }
        } else if (formattedMessages.length > 0) {
          // Merge with existing session storage messages to avoid losing local ones
          const storedMessages = loadMessagesFromStorage() || [];
          
          // Create a map of all messages by ID for easy lookup
          const messageMap = new Map();
          [...storedMessages, ...formattedMessages].forEach(msg => {
            messageMap.set(msg.id, msg);
          });
          
          // Convert back to array and sort by date
          const mergedMessages = Array.from(messageMap.values())
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
          
          console.log('[CHAT DEBUG] Merged messages:', mergedMessages);
          
          // Check for new admin messages before updating the state
          checkForNewAdminMessages(mergedMessages, lastMessageCount);
          
          setMessages(mergedMessages);
        } else if (messages.length === 0) {
          // Only set empty array if we don't already have messages
          setMessages(formattedMessages);
          setLastMessageCount(formattedMessages.length);
        }
      } else if (data.error) {
        console.log('[CHAT DEBUG] Error received from server:', data.error);
        // Don't clear existing messages, just add error
        const hasError = messages.some(msg => msg.id === 'system-error');
        if (!hasError) {
          setMessages(prev => [...prev, {
            id: 'system-error',
            content: data.error,
            isFromAdmin: true,
            createdAt: new Date()
          }]);
        }
      }
    } catch (error) {
      console.error('[CHAT DEBUG] Error fetching messages:', error);
      // Only add error message if we don't already have one
      const hasError = messages.some(msg => msg.id === 'system-error');
      if (!hasError) {
        setMessages(prev => [...prev, {
          id: 'system-error',
          content: 'Tidak dapat terhubung ke layanan chat. Silakan coba lagi nanti.',
          isFromAdmin: true,
          createdAt: new Date()
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[CHAT DEBUG] Submit started with message:', message);
    
    if (!message.trim() || !session?.user) {
      console.log('[CHAT DEBUG] Message empty or no session, aborting');
      return;
    }
    
    // Optimistically update UI
    const tempId = Date.now().toString();
    const newMessage = {
      id: tempId,
      content: message,
      isFromAdmin: false,
      createdAt: new Date(),
    };
    
    console.log('[CHAT DEBUG] Adding optimistic message to UI:', newMessage);
    setMessages(prev => {
      const updated = [...prev, newMessage];
      console.log('[CHAT DEBUG] Messages state after optimistic update:', updated);
      return updated;
    });
    
    const originalMessage = message;
    setMessage('');
    
    try {
      console.log('[CHAT DEBUG] Sending fetch request to /api/chat');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: originalMessage }),
      });
      
      const data = await response.json();
      console.log('[CHAT DEBUG] Server response:', data);
      
      if (!data.success) {
        console.log('[CHAT DEBUG] Server returned error, removing optimistic message');
        // Remove optimistic message if failed
        setMessages(prev => {
          const filtered = prev.filter(msg => msg.id !== tempId);
          console.log('[CHAT DEBUG] Messages after removing optimistic message:', filtered);
          return filtered;
        });

        // Add system error message
        if (data.message) {
          console.log('[CHAT DEBUG] Adding system error message:', data.message);
          setMessages(prev => {
            const withError = [...prev, {
              id: 'system-error-' + Date.now(),
              content: typeof data.message === 'string' ? data.message : 'Gagal mengirim pesan.',
              isFromAdmin: true,
              createdAt: new Date()
            }];
            console.log('[CHAT DEBUG] Messages after adding error:', withError);
            return withError;
          });
        } else {
          throw new Error('Failed to send message');
        }
      } else {
        // Check for notice message and display if present
        if (data.notice) {
          console.log('[CHAT DEBUG] Notice from server:', data.notice);
          const hasNoticeId = 'system-notice-' + Date.now();
          setMessages(prev => {
            const withNotice = [...prev, {
              id: hasNoticeId,
              content: data.notice,
              isFromAdmin: true,
              createdAt: new Date()
            }];
            return withNotice;
          });
        }
        
        // Validate server message format
        if (!data.message || !data.message.id || !data.message.content) {
          console.error('[CHAT DEBUG] Invalid message format from server:', data.message);
          // Keep the optimistic message instead of throwing an error
          return;
        }

        // Check if message format from server needs conversion
        let serverMessage = data.message;
        
        // Ensure createdAt is a Date object
        if (typeof serverMessage.createdAt === 'string') {
          serverMessage = {
            ...serverMessage,
            createdAt: new Date(serverMessage.createdAt)
          };
        }
        
        // Replace temp message with real one from server
        console.log('[CHAT DEBUG] Success! Replacing temp message with server message:', serverMessage);
        setMessages(prev => {
          const updated = prev.map(msg => msg.id === tempId ? serverMessage : msg);
          console.log('[CHAT DEBUG] Messages after replacing temp message:', updated);
          return updated;
        });
      }
    } catch (error) {
      console.error('[CHAT DEBUG] Error sending message:', error);
      // Don't remove optimistic message on network errors, just add error note
      setMessages(prev => {
        // Keep existing messages including optimistic one
        return [...prev, {
          id: 'system-error-' + Date.now(),
          content: 'Pesan terkirim secara lokal, tetapi gagal tersinkronisasi dengan server. Akan dicoba lagi nanti.',
          isFromAdmin: true,
          createdAt: new Date()
        }];
      });
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat bubble button with notification indicator */}
      <button
        onClick={toggleChat}
        className="flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full shadow-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 relative"
        aria-label="Open chat"
      >
        {isOpen ? (
          <FiX className="w-6 h-6 text-white" />
        ) : (
          <BiSupport className="w-8 h-8 text-white" />
        )}
        
        {/* Notification indicator */}
        {hasNewMessage && !isOpen && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div 
          className="absolute bottom-20 right-0 w-80 sm:w-96 bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-300 ease-in-out"
          style={{ 
            opacity: 1,
            transform: 'translateY(0) scale(1)',
            transformOrigin: 'bottom right'
          }}
        >
          {/* Chat header */}
          <div className="px-4 py-3 bg-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-indigo-500 rounded-full mr-2 flex items-center justify-center">
                <FiHeadphones className="text-white" />
              </div>
              <div>
                <h3 className="font-medium">Customer Support</h3>
                <p className="text-xs text-indigo-200">
                  {session?.user ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="focus:outline-none"
            >
              {isChatOpen ? (
                <FiChevronDown className="w-5 h-5" />
              ) : (
                <FiChevronUp className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Chat body */}
          {isChatOpen && (
            <div className="flex flex-col h-96 max-h-96">
              {!session?.user ? (
                <div className="flex-1 p-4 flex items-center justify-center">
                  <p className="text-gray-500 text-center">
                    Silakan login untuk menggunakan fitur chat
                  </p>
                </div>
              ) : (
                <>
                  {/* Messages container */}
                  <div className="flex-1 p-4 overflow-y-auto">
                    {isLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full space-y-2">
                        <p className="text-gray-500 text-center">
                          Belum ada pesan. Mulai chat dengan admin.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${
                              msg.isFromAdmin ? 'justify-start' : 'justify-end'
                            }`}
                          >
                            <div
                              className={`max-w-[80%] px-4 py-2 rounded-lg ${
                                msg.isFromAdmin
                                  ? 'bg-gray-200 text-gray-800'
                                  : 'bg-indigo-600 text-white'
                              }`}
                            >
                              <p>{msg.content}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  msg.isFromAdmin
                                    ? 'text-gray-500'
                                    : 'text-indigo-200'
                                }`}
                              >
                                {formatTime(msg.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  {/* Message input */}
                  <form onSubmit={handleSubmit} className="p-3 border-t">
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Ketik pesan..."
                        className="flex-1 px-4 py-2 bg-gray-100 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        disabled={isLoading}
                      />
                      <button
                        type="submit"
                        className="bg-indigo-600 text-white px-4 py-2 rounded-r-lg hover:bg-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        disabled={!message.trim() || isLoading}
                      >
                        <FiSend />
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FloatingChat; 