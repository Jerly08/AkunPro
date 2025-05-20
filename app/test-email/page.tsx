'use client';

import { useState } from 'react';

export default function TestEmailPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const sendTestEmail = async () => {
    try {
      setStatus('loading');
      setMessage('Sending test email...');
      
      const response = await fetch('/api/test-email-image');
      const data = await response.json();
      
      if (data.success) {
        setStatus('success');
        setMessage(`Test email sent successfully! MessageID: ${data.messageId}`);
      } else {
        setStatus('error');
        setMessage(`Failed to send email: ${data.message}`);
      }
    } catch (error) {
      setStatus('error');
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">Email Image Test</h1>
      <p className="mb-4">
        Click the button below to send a test email that verifies if the images
        are displaying correctly.
      </p>
      
      <button
        onClick={sendTestEmail}
        disabled={status === 'loading'}
        className={`w-full py-2 px-4 rounded ${
          status === 'loading' 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {status === 'loading' ? 'Sending...' : 'Send Test Email'}
      </button>
      
      {message && (
        <div 
          className={`mt-4 p-3 rounded ${
            status === 'success' 
              ? 'bg-green-100 text-green-800' 
              : status === 'error' 
                ? 'bg-red-100 text-red-800' 
                : 'bg-blue-100 text-blue-800'
          }`}
        >
          {message}
        </div>
      )}
      
      <div className="mt-8 border-t pt-4">
        <h2 className="text-lg font-semibold mb-2">What This Does</h2>
        <p className="text-sm text-gray-600">
          This test sends an email to the configured admin email address with 
          different versions of the logo image to test which method works best:
        </p>
        <ul className="list-disc ml-5 mt-2 text-sm text-gray-600">
          <li>Base64 embedded image (most reliable)</li>
          <li>GitHub hosted image (backup option)</li>
          <li>Domain hosted image (might not work yet)</li>
        </ul>
      </div>
    </div>
  );
} 