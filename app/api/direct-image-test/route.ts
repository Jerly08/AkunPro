import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

/**
 * This endpoint tests sending an email with the image as a direct attachment
 */
export async function GET(request: NextRequest) {
  try {
    // Load the image file
    const imagePath = path.join(process.cwd(), 'public', 'images', 'karakter_akunpro.png');
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Configure transporter (same as in lib/email.ts)
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER || 'akunproofficial@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'lpnq ykxf yacr mjfe',
      },
    });
    
    // Create email with inline attachment
    const info = await transporter.sendMail({
      from: `"AkunPro Direct Test" <${process.env.EMAIL_USER || 'akunproofficial@gmail.com'}>`,
      to: process.env.EMAIL_USER || 'akunproofficial@gmail.com',
      subject: 'AkunPro Logo - Direct Attachment Test',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Logo Direct Attachment Test</title>
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h1>Direct Attachment Test</h1>
          <p>The logo should appear below using an inline CID attachment:</p>
          
          <div style="margin: 30px 0;">
            <img src="cid:logo-image" alt="AkunPro" style="max-width: 150px;">
          </div>
          
          <p>If you can see the logo above, the test was successful!</p>
          <p>Test time: ${new Date().toLocaleString()}</p>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: 'karakter_akunpro.png',
          content: imageBuffer,
          cid: 'logo-image' // Content ID referenced in the HTML
        }
      ]
    });
    
    // Return success
    return NextResponse.json({
      success: true,
      message: 'Email with direct attachment sent',
      messageId: info.messageId
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