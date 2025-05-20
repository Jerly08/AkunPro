import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, getLogoUrl } from '@/lib/email';

/**
 * This endpoint tests sending an email with the fixed logo
 */
export async function GET(request: NextRequest) {
  try {
    const logoUrl = getLogoUrl();
    
    // Create a very simple email with just the logo
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Logo Fix Test</title>
      </head>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <h1>Logo Fix Verification</h1>
        <p>The logo should appear below:</p>
        
        <div style="margin: 30px 0;">
          <img src="${logoUrl}" alt="AkunPro" width="150" height="auto" 
               style="display: block; max-width: 150px; margin: 0 auto; border: 0;">
        </div>
        
        <p>If you can see the AkunPro character logo above, the fix was successful!</p>
        <p>Test time: ${new Date().toLocaleString()}</p>
      </body>
      </html>
    `;
    
    // Send the test email
    const result = await sendEmail({
      to: process.env.EMAIL_USER || 'akunproofficial@gmail.com',
      subject: 'AkunPro Logo Fix Verification',
      html
    });
    
    // Return a success message
    return NextResponse.json({
      success: true,
      message: 'Logo fix verification email sent',
      logoUrl,
      emailResult: result
    });
  } catch (error) {
    console.error('Error sending logo verification email:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to send verification email',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 