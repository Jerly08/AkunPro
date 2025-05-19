const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Clean .next directory
console.log('Cleaning build directory...');
try {
  if (fs.existsSync(path.join(process.cwd(), '.next'))) {
    fs.rmSync(path.join(process.cwd(), '.next'), { recursive: true, force: true });
  }
  console.log('.next directory removed successfully');
} catch (err) {
  console.error('Error while removing .next directory:', err);
}

// Check and remove the (home) directory if it still exists
const homeGroupPath = path.join(process.cwd(), 'app', '(home)');
if (fs.existsSync(homeGroupPath)) {
  try {
    fs.rmSync(homeGroupPath, { recursive: true, force: true });
    console.log('(home) directory removed successfully');
  } catch (err) {
    console.error('Error while removing (home) directory:', err);
  }
}

// Run build command
console.log('\nStarting build process...');
exec('npx next build', (error, stdout, stderr) => {
  if (error) {
    console.error(`Build error: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Build stderr: ${stderr}`);
  }
  
  console.log(stdout);
  
  // Fix for standalone mode - manually update reference paths
  try {
    const standalonePath = path.join(process.cwd(), '.next', 'standalone', '.next', 'server', 'app');
    if (fs.existsSync(standalonePath)) {
      console.log('\nFixing standalone output...');
      
      // Check server map file for references to (home) and remove them
      const serverPath = path.join(process.cwd(), '.next', 'server');
      if (fs.existsSync(serverPath)) {
        const pagesManifestPath = path.join(serverPath, 'pages-manifest.json');
        if (fs.existsSync(pagesManifestPath)) {
          try {
            const pagesManifest = require(pagesManifestPath);
            const newManifest = {};
            
            for (const [key, value] of Object.entries(pagesManifest)) {
              if (!key.includes('(home)')) {
                newManifest[key] = value;
              }
            }
            
            fs.writeFileSync(pagesManifestPath, JSON.stringify(newManifest, null, 2));
            console.log('Cleaned up references in pages-manifest.json');
          } catch (err) {
            console.error('Error updating pages manifest:', err);
          }
        }
      }
    }
  } catch (err) {
    console.error('Error during standalone fix:', err);
  }
  
  console.log('\nBuild process completed.');
}); 