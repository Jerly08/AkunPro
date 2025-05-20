import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, getLogoUrl } from '@/lib/email';
import fs from 'fs';
import path from 'path';

/**
 * This is a test endpoint to verify the logo image appears correctly in emails
 */
export async function GET(request: NextRequest) {
  try {
    // Load the logo image directly here as a backup test
    let logoImage = '';
    try {
      const imagePath = path.join(process.cwd(), 'public', 'images', 'karakter_akunpro.png');
      if (fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath);
        logoImage = `data:image/png;base64,${imageBuffer.toString('base64')}`;
      }
    } catch (error) {
      console.error('Failed to load image in API route:', error);
      logoImage = 'https://raw.githubusercontent.com/yasermazlum/AkunPro/main/public/images/karakter_akunpro.png';
    }

    // Get the logo URL from the email.ts file
    const emailLibraryLogo = getLogoUrl();

    // Simple email template with the logo image
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Logo Test API</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
          <h1>Logo Image API Test</h1>
          
          <p>This email was sent from the /api/test-email-logo API endpoint.</p>
          
          <div style="margin: 30px 0; text-align: center;">
            <h3>Direct Image Load:</h3>
            <img src="${logoImage}" alt="Direct Loaded Logo" style="max-width: 150px;">
          </div>
          
          <div style="margin: 30px 0; text-align: center;">
            <h3>From lib/email.ts getLogoUrl():</h3>
            <img src="${emailLibraryLogo}" alt="From email.ts" style="max-width: 150px;">
          </div>
          
          <p>Test sent at: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
    
    // Send a test email
    const result = await sendEmail({
      to: process.env.EMAIL_USER || 'akunproofficial@gmail.com',
      subject: 'AkunPro Logo Test from API',
      html
    });
    
    // Return the result
    return NextResponse.json({
      success: true,
      message: 'Test email sent! Check your inbox.',
      logoLength: emailLibraryLogo.length,
      logoPreview: emailLibraryLogo.substring(0, 50) + '...',
      result
    });
    
  } catch (error) {
    console.error('Error in test-email-logo API:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to send test email',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 