/**
 * This script fixes the EPERM permission issues with Prisma client
 * Run it with "node scripts/fix-permissions.js"
 */

const fs = require('fs');
const path = require('path');

// Paths that need permission fixing
const paths = [
  '../node_modules/.prisma/client',
];

function fixPermissions(dir) {
  console.log(`Checking directory: ${dir}`);
  
  try {
    // Make sure directory exists
    if (!fs.existsSync(dir)) {
      console.log(`Directory does not exist: ${dir}`);
      return;
    }
    
    // Read all files and subdirectories
    const items = fs.readdirSync(dir);
    
    // Fix permissions on each file
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        // Recursively fix permissions in subdirectories
        fixPermissions(itemPath);
      } else {
        // Fix file permissions
        try {
          console.log(`Setting permissions for: ${itemPath}`);
          fs.chmodSync(itemPath, 0o666); // Read and write for all
        } catch (error) {
          console.error(`Error fixing permissions for ${itemPath}:`, error.message);
        }
      }
    }
    
    console.log(`Successfully fixed permissions in ${dir}`);
  } catch (error) {
    console.error(`Error processing directory ${dir}:`, error.message);
  }
}

// Process each path
for (const p of paths) {
  const fullPath = path.resolve(__dirname, p);
  fixPermissions(fullPath);
}

console.log('Permission fix attempt completed.'); 