'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LogoTestPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<{[key: string]: any}>({});
  const [error, setError] = useState<string | null>(null);

  const testEndpoints = [
    { name: 'CID Method (Recommended)', endpoint: '/api/test-email-cid', id: 'cid' },
    { name: 'Direct Attachment', endpoint: '/api/direct-image-test', id: 'direct' },
    { name: 'Verification Fix', endpoint: '/api/verify-logo-fix', id: 'verify' },
  ];

  const runTest = async (endpoint: string, id: string) => {
    setLoading(id);
    setError(null);
    
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      
      setResults(prev => ({
        ...prev,
        [id]: { 
          ...data,
          timestamp: new Date().toLocaleString()
        }
      }));
      
    } catch (err) {
      setError(`Error with ${id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(null);
    }
  };

  const clearResults = () => {
    setResults({});
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 mt-8">
      <h1 className="text-3xl font-bold mb-6">AkunPro Logo Email Tests</h1>
      <p className="mb-6">
        This page tests the various methods of embedding the logo in emails.
        Click on each test to try a different approach.
      </p>
      
      <div className="grid gap-4 mb-8">
        {testEndpoints.map(endpoint => (
          <div key={endpoint.id} className="border rounded-lg p-4 bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-2">{endpoint.name}</h2>
            <button
              onClick={() => runTest(endpoint.endpoint, endpoint.id)}
              disabled={loading !== null}
              className={`px-4 py-2 rounded ${
                loading === endpoint.id 
                  ? 'bg-gray-400' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {loading === endpoint.id ? 'Sending...' : 'Send Test Email'}
            </button>
            
            {results[endpoint.id] && (
              <div className="mt-3 text-sm">
                <div className="bg-green-50 text-green-700 p-3 rounded">
                  <p>✅ Test sent at {results[endpoint.id].timestamp}</p>
                  {results[endpoint.id].messageId && (
                    <p className="mt-1">Message ID: {results[endpoint.id].messageId}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
          {error}
        </div>
      )}
      
      {Object.keys(results).length > 0 && (
        <button
          onClick={clearResults}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
        >
          Clear Results
        </button>
      )}
      
      <div className="mt-10 border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">Current Logo Preview</h2>
        <div className="bg-gray-100 p-6 rounded-lg flex justify-center">
          <img 
            src="/images/karakter_akunpro.png" 
            alt="AkunPro Logo" 
            className="max-w-[200px]"
          />
        </div>
      </div>
    </div>
  );
} 