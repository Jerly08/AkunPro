// Script to send a test email with the logo image
require('dotenv').config();
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Load the image as base64
function loadLogoAsBase64() {
  try {
    // Try multiple paths
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'images', 'karakter_akunpro.png'),
      path.join(__dirname, '..', 'public', 'images', 'karakter_akunpro.png'),
      path.resolve('public/images/karakter_akunpro.png')
    ];
    
    let imageBuffer = null;
    let successPath = null;
    
    for (const testPath of possiblePaths) {
      try {
        console.log(`Trying path: ${testPath}`);
        if (fs.existsSync(testPath)) {
          imageBuffer = fs.readFileSync(testPath);
          successPath = testPath;
          break;
        }
      } catch (err) {
        console.log(`Failed to load from ${testPath}`);
      }
    }
    
    if (!imageBuffer) {
      throw new Error('Could not find image in any of the potential paths');
    }
    
    console.log(`Successfully loaded image from: ${successPath}`);
    return `data:image/png;base64,${imageBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Error loading image:', error);
    return 'https://raw.githubusercontent.com/yasermazlum/AkunPro/main/public/images/karakter_akunpro.png';
  }
}

// Configure email transporter (same as in lib/email.ts)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER || 'akunproofficial@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'lpnq ykxf yacr mjfe',
  },
});

// Create a test email HTML
async function sendTestEmail() {
  const logoImage = loadLogoAsBase64();
  
  // Simple test email template
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test Email - Logo Image</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
        <h1>Logo Image Test</h1>
        
        <p>This is a test to verify the logo image is displaying correctly in emails:</p>
        
        <div style="margin: 30px 0; text-align: center;">
          <img src="${logoImage}" alt="AkunPro Logo" style="max-width: 150px;">
        </div>
        
        <p>If you can see the image above, the test was successful.</p>
        
        <p>Test completed at: ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
  
  try {
    // Send the test email
    const info = await transporter.sendMail({
      from: `"AkunPro Test" <${process.env.EMAIL_USER || 'akunproofficial@gmail.com'}>`,
      to: process.env.EMAIL_USER || 'akunproofficial@gmail.com', // Send to same address
      subject: 'AkunPro Logo Image Test',
      html
    });
    
    console.log('Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Failed to send test email:', error);
  }
}

// Run the test
sendTestEmail().catch(console.error); 