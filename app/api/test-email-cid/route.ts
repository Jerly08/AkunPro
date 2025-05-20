import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

/**
 * Test endpoint for CID-based image emails
 */
export async function GET(request: NextRequest) {
  try {
    // Create a simple email template with the CID-attached logo
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>CID Logo Test</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center;">
        <h1>AkunPro Logo Test (CID Method)</h1>
        <p>The logo should appear below:</p>
        
        <div style="margin: 30px auto; max-width: 200px; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
          <!-- This image uses the CID reference which will be replaced by the actual image -->
          <img src="cid:akunpro-logo" alt="AkunPro Logo" style="max-width: 100%;">
        </div>
        
        <p>If you can see the logo above, the CID attachment method is working!</p>
        <p><small>Test sent: ${new Date().toLocaleString()}</small></p>
      </body>
      </html>
    `;
    
    // Send the test email
    const result = await sendEmail({
      to: process.env.EMAIL_USER || 'akunproofficial@gmail.com',
      subject: 'AkunPro Logo Test (CID Method)',
      html
    });
    
    return NextResponse.json({
      success: true,
      message: 'Test email sent with CID logo attachment',
      result
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to send test email',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 