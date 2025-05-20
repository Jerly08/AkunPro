const fs = require('fs');
const path = require('path');

// Function to convert an image to base64
function imageToBase64() {
  try {
    // Define the path to the image
    const imagePath = path.join(process.cwd(), 'public', 'images', 'karakter_akunpro.png');
    console.log('Attempting to load image from:', imagePath);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`File not found: ${imagePath}`);
    }
    
    // Read the file
    console.log('Loading image file...');
    const imageBuffer = fs.readFileSync(imagePath);
    console.log(`Image loaded: ${imageBuffer.length} bytes`);
    
    // Convert to base64
    const base64 = imageBuffer.toString('base64');
    console.log(`Base64 string length: ${base64.length} characters`);
    
    // Create the data URL
    const dataUrl = `data:image/png;base64,${base64}`;
    
    // Create an HTML file to test the image
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Base64 Image Test</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin: 2rem; }
          img { max-width: 300px; border: 1px solid #ccc; margin: 1rem; }
        </style>
      </head>
      <body>
        <h1>Base64 Image Test</h1>
        <p>This is the base64 encoded image:</p>
        <div>
          <img src="${dataUrl}" alt="Base64 Encoded Image">
        </div>
        <h3>Base64 string (first 100 characters):</h3>
        <pre style="text-align: left; background: #f5f5f5; padding: 1rem; overflow: auto;">${dataUrl.substring(0, 100)}...</pre>
      </body>
      </html>
    `;
    
    // Write the HTML file
    const htmlPath = path.join(process.cwd(), 'base64-test.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`HTML test file created: ${htmlPath}`);
    
    // Also write the base64 string to a file
    const outputPath = path.join(process.cwd(), 'base64-image.txt');
    fs.writeFileSync(outputPath, dataUrl);
    console.log(`Base64 data saved to: ${outputPath}`);
    
    return { 
      success: true,
      message: `Image successfully encoded. Check ${htmlPath} to view the image.` 
    };
  } catch (error) {
    console.error('Error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Run the function
const result = imageToBase64();
console.log('\nResult:', result.success ? 'SUCCESS' : 'FAILED');
console.log(result.message || result.error); 