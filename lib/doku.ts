// DOKU Payment Gateway Configuration
export const DOKU_CONFIG = {
  BASE_URL: process.env.DOKU_BASE_URL || 'https://api-sandbox.doku.com',
  CLIENT_ID: process.env.DOKU_CLIENT_ID || '',
  SECRET_KEY: process.env.DOKU_SECRET_KEY || '',
  MERCHANT_ID: process.env.DOKU_MERCHANT_ID || '',
};

// Generate headers for DOKU API
export function generateDokuHeaders(requestId: string, clientId: string, timestamp: string, signature: string) {
  return {
    'Content-Type': 'application/json',
    'Client-Id': clientId,
    'Request-Id': requestId,
    'Request-Timestamp': timestamp,
    'Signature': signature,
  };
}

// Generate DOKU signature
export function generateSignature(
  clientId: string, 
  requestId: string, 
  requestTimestamp: string, 
  requestTarget: string, 
  secretKey: string, 
  digestValue: string = ''
) {
  const crypto = require('crypto');
  const componentSignature = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${requestTimestamp}\nRequest-Target:${requestTarget}`;
  
  // Add digest if available
  const componentToSign = digestValue 
    ? `${componentSignature}\nDigest:${digestValue}` 
    : componentSignature;
  
  // Create HMAC signature using SHA256
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(componentToSign);
  
  return hmac.digest('base64');
}

// Helper to generate digest for request body
export function generateDigest(requestBody: any) {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(requestBody));
  return `SHA-256=${hash.digest('base64')}`;
} 