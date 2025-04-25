/**
 * Script untuk memeriksa keamanan environment variables
 * Run with: node scripts/check-security.js
 */

// List environment variables yang diharapkan
const requiredEnvVars = [
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'DATABASE_URL',
  'PAYMENT_SIGNATURE_SECRET',
  'ACCOUNT_ENCRYPTION_KEY'
];

// Minimum length untuk secret keys
const MIN_SECRET_LENGTH = 32;

function checkEnvSecurity() {
  console.log('🔒 Checking security of environment variables...');
  
  let hasErrors = false;
  
  // Periksa keberadaan environment variables yang diperlukan
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`❌ Missing required environment variable: ${envVar}`);
      hasErrors = true;
    }
  }
  
  // Periksa panjang minimum untuk secret keys
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < MIN_SECRET_LENGTH) {
    console.error(`❌ NEXTAUTH_SECRET is too short (minimum: ${MIN_SECRET_LENGTH} characters)`);
    hasErrors = true;
  }
  
  if (process.env.ACCOUNT_ENCRYPTION_KEY && process.env.ACCOUNT_ENCRYPTION_KEY.length < MIN_SECRET_LENGTH) {
    console.error(`❌ ACCOUNT_ENCRYPTION_KEY is too short (minimum: ${MIN_SECRET_LENGTH} characters)`);
    hasErrors = true;
  }
  
  if (process.env.PAYMENT_SIGNATURE_SECRET && process.env.PAYMENT_SIGNATURE_SECRET.length < MIN_SECRET_LENGTH) {
    console.error(`❌ PAYMENT_SIGNATURE_SECRET is too short (minimum: ${MIN_SECRET_LENGTH} characters)`);
    hasErrors = true;
  }
  
  // Periksa jika DATABASE_URL mengandung kredensial yang hardcoded
  if (process.env.DATABASE_URL && 
      (process.env.DATABASE_URL.includes('password=') || process.env.DATABASE_URL.includes('user='))) {
    console.warn('⚠️ DATABASE_URL contains hardcoded credentials. Consider using environment variables for credentials.');
  }
  
  // Periksa jika menggunakan HTTPS pada production
  if (process.env.NODE_ENV === 'production' && 
      process.env.NEXTAUTH_URL && 
      !process.env.NEXTAUTH_URL.startsWith('https://')) {
    console.error('❌ NEXTAUTH_URL should use HTTPS in production');
    hasErrors = true;
  }
  
  if (hasErrors) {
    console.error('❌ Security check failed. Please fix the issues above.');
    // Dalam aplikasi produksi, mungkin sebaiknya force exit di sini
    // process.exit(1);
  } else {
    console.log('✅ Security check passed.');
  }
}

// Jalankan pemeriksaan
checkEnvSecurity(); 