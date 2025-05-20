const fs = require('fs');
const path = require('path');

// A simple test to load the image
console.log('Starting image load test...');

try {
  // Get the project root directory
  const projectRoot = process.cwd();
  console.log('Project directory:', projectRoot);
  
  // Try to list the public/images directory
  const imagesDir = path.join(projectRoot, 'public', 'images');
  console.log('Images directory:', imagesDir);
  
  if (fs.existsSync(imagesDir)) {
    console.log('Images directory exists');
    const files = fs.readdirSync(imagesDir);
    console.log('Files in images directory:', files);
  } else {
    console.log('Images directory does not exist');
  }
  
  // Try to load the specific image
  const imagePath = path.join(projectRoot, 'public', 'images', 'karakter_akunpro.png');
  console.log('Image path:', imagePath);
  
  if (fs.existsSync(imagePath)) {
    console.log('Image file exists');
    const stats = fs.statSync(imagePath);
    console.log('File size:', stats.size, 'bytes');
    
    // Try to read the file
    const imageBuffer = fs.readFileSync(imagePath);
    console.log('Successfully read image, size:', imageBuffer.length, 'bytes');
  } else {
    console.log('Image file does not exist');
  }
} catch (error) {
  console.error('Error during test:', error);
} 