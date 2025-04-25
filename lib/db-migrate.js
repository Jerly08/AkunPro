// Helper script untuk migrasi database dengan XAMPP
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path ke MySQL di XAMPP
const MYSQL_PATH = 'c:\\xampp4\\mysql\\bin\\mysql.exe';
const MYSQLADMIN_PATH = 'c:\\xampp4\\mysql\\bin\\mysqladmin.exe';

// Database info
const DB_USER = 'root';
const DB_PASS = '';
const DB_HOST = 'localhost';
const DB_NAME = 'netflix_spotify_marketplace';

// Fungsi untuk membuat database
function createDatabase() {
  try {
    console.log('🔍 Memeriksa koneksi MySQL...');
    
    // Cek koneksi ke MySQL
    execSync(`"${MYSQLADMIN_PATH}" -u ${DB_USER} -h ${DB_HOST} ping`, { stdio: 'pipe' });
    console.log('✅ Koneksi ke MySQL berhasil');
    
    // Buat database jika belum ada
    console.log(`🛢️ Membuat database "${DB_NAME}"...`);
    execSync(`"${MYSQL_PATH}" -u ${DB_USER} -h ${DB_HOST} -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME};"`, { stdio: 'pipe' });
    console.log(`✅ Database "${DB_NAME}" berhasil dibuat atau sudah ada`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

// Fungsi untuk menjalankan migrasi
function runMigration() {
  try {
    console.log('🔄 Menjalankan migrasi Prisma...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ Migrasi berhasil diterapkan');
    
    console.log('🌱 Menjalankan seed data...');
    execSync('npx prisma db seed', { stdio: 'inherit' });
    console.log('✅ Seed data berhasil diterapkan');
    
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log('=== XAMPP MySQL Database Migration Helper ===');
  
  // Langkah 1: Cek keberadaan file MySQL
  if (!fs.existsSync(MYSQL_PATH)) {
    console.error(`❌ MySQL tidak ditemukan di ${MYSQL_PATH}`);
    console.log('⚠️ Pastikan XAMPP sudah terinstall di lokasi yang benar atau ubah MYSQL_PATH di script ini');
    return;
  }
  
  // Langkah 2: Buat database
  const dbCreated = createDatabase();
  if (!dbCreated) {
    console.error('❌ Gagal membuat database. Pastikan MySQL server berjalan');
    return;
  }
  
  // Langkah 3: Jalankan migrasi
  const migrationSuccess = runMigration();
  if (!migrationSuccess) {
    console.error('❌ Gagal menjalankan migrasi');
    return;
  }
  
  console.log('🎉 Database berhasil dimigrasikan!');
}

main().catch(console.error); 