'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';

export default function TestEmailPage() {
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState({
    customerName: 'Test User',
    orderId: 'TEST-001',
    totalAmount: 299000,
    status: 'PAID',
    items: [
      { name: 'Netflix Premium', price: 149000 },
      { name: 'Spotify Premium', price: 150000 }
    ]
  });

  const handleSendTestEmail = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Email test berhasil dikirim!');
      } else {
        throw new Error(data.message || 'Gagal mengirim email');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gagal mengirim email test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Test Email Sender</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Data Test</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Customer
                </label>
                <input
                  type="text"
                  value={testData.customerName}
                  onChange={(e) => setTestData(prev => ({ ...prev, customerName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order ID
                </label>
                <input
                  type="text"
                  value={testData.orderId}
                  onChange={(e) => setTestData(prev => ({ ...prev, orderId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount
                </label>
                <input
                  type="number"
                  value={testData.totalAmount}
                  onChange={(e) => setTestData(prev => ({ ...prev, totalAmount: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={testData.status}
                  onChange={(e) => setTestData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="PAID">PAID</option>
                  <option value="FAILED">FAILED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="REFUNDED">REFUNDED</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <Button
              onClick={handleSendTestEmail}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Mengirim...' : 'Kirim Email Test'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 