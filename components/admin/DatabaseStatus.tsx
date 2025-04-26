'use client';

import { useState, useEffect } from 'react';
import { FiDatabase, FiRefreshCw, FiChevronDown, FiChevronUp, FiServer, FiUser, FiHardDrive } from 'react-icons/fi';

interface DatabaseStatus {
  status: 'ok' | 'pending';
  message: string;
  timestamp?: string;
  config?: {
    prisma_url_configured: boolean;
    direct_connection_configured: boolean;
    host: string;
    port: string;
    database: string;
    user: string;
    password_configured: boolean;
  };
}

export default function DatabaseStatus() {
  const [status, setStatus] = useState<DatabaseStatus>({
    status: 'pending',
    message: 'Memeriksa koneksi database...'
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const checkDatabaseStatus = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      
      setStatus({
        status: data.status === 'ok' ? 'ok' : 'pending',
        message: data.message,
        timestamp: data.timestamp,
        config: data.config
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            title={showDetails ? "Sembunyikan detail" : "Tampilkan detail"}
          >
            {showDetails ? <FiChevronUp /> : <FiChevronDown />}
          </button>
          <button
            onClick={checkDatabaseStatus}
            disabled={isRefreshing}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            title="Refresh status database"
          >
            <FiRefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
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

      {/* Database Configuration Details */}
      {showDetails && status.config && (
        <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-600">
          <h4 className="font-medium mb-2">Konfigurasi Database</h4>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1">
              <FiHardDrive className="text-gray-400" />
              <span>Prisma URL:</span>
              <span className={status.config.prisma_url_configured ? "text-green-600" : "text-red-600"}>
                {status.config.prisma_url_configured ? '✓' : '✗'}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <FiUser className="text-gray-400" />
              <span>User:</span>
              <span>{status.config.user}</span>
            </div>

            <div className="flex items-center gap-1">
              <FiServer className="text-gray-400" />
              <span>Host:</span>
              <span>{status.config.host}:{status.config.port}</span>
            </div>

            <div className="flex items-center gap-1">
              <FiDatabase className="text-gray-400" />
              <span>Database:</span>
              <span>{status.config.database}</span>
            </div>

            <div className="flex items-center gap-1 col-span-2">
              <span>Password:</span>
              <span className={status.config.password_configured ? "text-green-600" : "text-yellow-600"}>
                {status.config.password_configured ? 'Configured' : 'Not Set'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 