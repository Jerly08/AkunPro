const fs = require('fs');
const path = require('path');

// Function to safely load the image
function loadImageAsBase64() {
  try {
    // Define multiple possible paths to try (especially for Windows environments)
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'images', 'karakter_akunpro.png'),
      path.join(process.cwd(), '/public/images/karakter_akunpro.png'),
      path.join(__dirname, '..', 'public', 'images', 'karakter_akunpro.png'),
      './public/images/karakter_akunpro.png',
      'public/images/karakter_akunpro.png',
    ];

    // Try each path until we find one that works
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
    const base64Data = imageBuffer.toString('base64');
    console.log(`Image size: ${imageBuffer.length} bytes`);
    console.log(`Base64 length: ${base64Data.length} characters`);
    
    return {
      base64: `data:image/png;base64,${base64Data}`,
      path: successPath,
      size: imageBuffer.length
    };
  } catch (error) {
    console.error('Error loading image:', error);
    return {
      error: error.message,
      success: false
    };
  }
}

// Run the test
const result = loadImageAsBase64();
console.log('\nRESULT:', result.success === false ? 'FAILED' : 'SUCCESS');

// Show a preview of the base64 string (first 100 chars)
if (result.base64) {
  console.log('\nBase64 Preview:');
  console.log(result.base64.substring(0, 100) + '...');
  
  // Write the result to a file for easy inspection
  fs.writeFileSync(
    path.join(__dirname, 'image-test-results.json'), 
    JSON.stringify(result, null, 2)
  );
  console.log('\nFull results written to scripts/image-test-results.json');
} 