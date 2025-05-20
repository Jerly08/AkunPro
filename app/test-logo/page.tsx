'use client';

import { useState } from 'react';

export default function TestLogoPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const sendTestEmail = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      const response = await fetch('/api/test-email-logo');
      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.message || 'Failed to send test email');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 mt-10">
      <h1 className="text-2xl font-bold mb-4">Email Logo Test</h1>
      <p className="mb-6">
        This page tests if the AkunPro logo appears correctly in auto-generated emails.
        Click the button below to send a test email.
      </p>
      
      <div className="mb-6">
        <button 
          onClick={sendTestEmail}
          disabled={loading}
          className={`px-4 py-2 rounded ${loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white font-medium`}
        >
          {loading ? 'Sending...' : 'Send Test Email'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {result && (
        <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Success!</p>
          <p>Message ID: {result.result?.messageId || 'N/A'}</p>
          <p className="mt-2">Logo length: {result.logoLength} characters</p>
          <p className="text-xs mt-1 break-all">Preview: {result.logoPreview}</p>
        </div>
      )}
      
      <div className="mt-8 border-t pt-4">
        <h2 className="text-lg font-semibold mb-2">Test Image</h2>
        <p className="mb-4">This is how the logo currently appears in the public folder:</p>
        <div className="bg-gray-100 p-4 rounded flex justify-center">
          <img 
            src="/images/karakter_akunpro.png" 
            alt="AkunPro Logo from public folder" 
            className="max-w-[150px]"
          />
        </div>
      </div>
    </div>
  );
} 