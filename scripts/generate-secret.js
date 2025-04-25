// Script untuk menghasilkan secret key untuk NextAuth

const crypto = require('crypto');

// Generate random hex string dengan panjang 64 karakter
const secret = crypto.randomBytes(32).toString('hex');

console.log('Generated NEXTAUTH_SECRET:');
console.log(secret);
console.log('\nTambahkan secret ini ke environment variables Vercel Anda.'); 