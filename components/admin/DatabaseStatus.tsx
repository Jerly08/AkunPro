'use client';

import { useState, useEffect } from 'react';
import { FiDatabase, FiRefreshCw } from 'react-icons/fi';

interface DatabaseStatus {
  status: 'ok' | 'pending';
  message: string;
  timestamp?: string;
}

export default function DatabaseStatus() {
  const [status, setStatus] = useState<DatabaseStatus>({
    status: 'pending',
    message: 'Memeriksa koneksi database...'
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkDatabaseStatus = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      
      setStatus({
        status: data.status === 'ok' ? 'ok' : 'pending',
        message: data.message,
        timestamp: data.timestamp
      });
    } catch (error) {
      // Biarkan status tetap 'pending', jangan tampilkan error
      setStatus(prev => ({
        ...prev,
        message: 'Menunggu koneksi database...'
      }));
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkDatabaseStatus();
    
    // Tambahkan interval untuk cek status secara berkala
    const interval = setInterval(checkDatabaseStatus, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold flex items-center">
          <FiDatabase className="mr-2" /> Status Database
        </h3>
        <button
          onClick={checkDatabaseStatus}
          disabled={isRefreshing}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          title="Refresh status database"
        >
          <FiRefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-2 ${
          status.status === 'ok' 
            ? 'bg-green-500' 
            : 'bg-yellow-500'
        }`} />
        
        <div>
          <p className="text-sm font-medium">{
            status.status === 'ok' 
              ? 'Terhubung' 
              : 'Menunggu...'
          }</p>
          <p className="text-xs text-gray-500">{status.message}</p>
          {status.timestamp && (
            <p className="text-xs text-gray-400">
              {new Date(status.timestamp).toLocaleString('id-ID')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 