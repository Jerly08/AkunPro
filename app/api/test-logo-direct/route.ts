import { NextRequest, NextResponse } from 'next/server';
import { getLogoUrl } from '@/lib/email';

/**
 * A simple endpoint to test the logo URL
 */
export async function GET(request: NextRequest) {
  const logoUrl = getLogoUrl();
  
  // Return HTML to display the logo
  return new Response(
    `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Logo Test</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; margin: 2rem; }
        img { max-width: 200px; border: 1px solid #ccc; padding: 1rem; }
      </style>
    </head>
    <body>
      <h1>AkunPro Logo Test</h1>
      <p>This is the logo that will be used in emails:</p>
      <p><img src="${logoUrl}" alt="AkunPro Logo"></p>
      <p>Logo URL: ${logoUrl}</p>
    </body>
    </html>`,
    {
      headers: { 'Content-Type': 'text/html' },
    }
  );
} 