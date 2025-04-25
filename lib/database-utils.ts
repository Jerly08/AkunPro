import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

/**
 * Memeriksa apakah server MySQL berjalan
 */
export async function checkMySQLStatus(): Promise<{ 
  running: boolean; 
  message: string;
  details?: string;
}> {
  let command = '';
  
  // Pilih perintah berdasarkan OS
  switch (process.platform) {
    case 'win32':
      command = 'sc query mysql';
      break;
    case 'darwin': // macOS
      command = 'ps aux | grep mysql | grep -v grep || true';
      break;
    default: // Linux dan lainnya
      command = 'systemctl status mysql || systemctl status mariadb || ps aux | grep mysql | grep -v grep || true';
      break;
  }
  
  try {
    const { stdout } = await execPromise(command);
    
    if (process.platform === 'win32') {
      // Di Windows, periksa apakah layanan MySQL berjalan
      if (stdout.includes('RUNNING')) {
        return {
          running: true,
          message: 'MySQL service is running',
          details: stdout.trim()
        };
      } else {
        return {
          running: false,
          message: 'MySQL service is not running',
          details: stdout.trim()
        };
      }
    } else {
      // Di Unix-like OS, periksa apakah proses MySQL ada
      if (stdout.trim()) {
        return {
          running: true,
          message: 'MySQL process is running',
          details: stdout.trim()
        };
      } else {
        return {
          running: false,
          message: 'MySQL process is not running',
          details: stdout.trim()
        };
      }
    }
  } catch (error) {
    return {
      running: false,
      message: `Error checking MySQL status: ${error instanceof Error ? error.message : String(error)}`,
      details: error instanceof Error ? error.stack : undefined
    };
  }
}

/**
 * Logs database connection info to the console
 */
export function logDatabaseInfo() {
  const dbUrl = process.env.DATABASE_URL || '';
  
  try {
    // Parse database URL
    const url = new URL(dbUrl);
    
    console.log(`
================ DATABASE INFO ================
Host: ${url.hostname}
Port: ${url.port || '3306'}
Database: ${url.pathname.substring(1)}
User: ${url.username}
Auth: ${url.password ? 'Password set' : 'No password'}
==============================================
    `);
    
    // Periksa status MySQL server
    checkMySQLStatus().then(status => {
      console.log(`MySQL Server Status: ${status.running ? '✅ Running' : '❌ Not running'}`);
      console.log(`Status Details: ${status.message}`);
    });
    
  } catch (error) {
    console.error('Invalid database URL format', error);
  }
} 