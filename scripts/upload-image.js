const fs = require('fs');
const path = require('path');
const imgbbUploader = require('imgbb-uploader');

// Read the image file as base64
const imagePath = path.join(__dirname, '../public/images/karakter_akunpro.png');
const imageAsBase64 = fs.readFileSync(imagePath, { encoding: 'base64' });

// Upload to ImgBB
// Note: You'll need to replace this with your own ImgBB API key
// Get a free API key from https://api.imgbb.com/
imgbbUploader({
  apiKey: "YOUR_IMGBB_API_KEY", // Replace with your ImgBB API key
  base64string: imageAsBase64,
  name: "karakter_akunpro.png"
})
  .then((response) => {
    console.log("Upload success!");
    console.log("Image URL:", response.url);
    console.log("Display URL:", response.display_url);
    console.log("Delete URL:", response.delete_url);
    
    // Save the URL to a file for future reference
    fs.writeFileSync(
      path.join(__dirname, 'image-url.txt'),
      `URL: ${response.url}\nDisplay URL: ${response.display_url}\nDelete URL: ${response.delete_url}`
    );
  })
  .catch((error) => {
    console.error("Upload failed:", error);
  }); 