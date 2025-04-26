// Helper script untuk migrasi database dengan XAMPP
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Path ke MySQL di XAMPP
const MYSQL_PATH = process.env.MYSQL_PATH || 'c:\\xampp\\mysql\\bin\\mysql.exe';
const MYSQLADMIN_PATH = process.env.MYSQLADMIN_PATH || 'c:\\xampp\\mysql\\bin\\mysqladmin.exe';

// Database info from environment variables
const DB_USER = process.env.DATABASE_USER || 'root';
const DB_PASS = process.env.DATABASE_PASSWORD || '';
const DB_HOST = process.env.DATABASE_HOST || 'localhost';
const DB_NAME = process.env.DATABASE_NAME || 'netflix_spotify_marketplace';
const DB_PORT = process.env.DATABASE_PORT || '3306';

// Fungsi untuk membuat database
function createDatabase() {
  try {
    console.log('🔍 Memeriksa koneksi MySQL...');
    
    // Cek koneksi ke MySQL
    let connectCmd = `"${MYSQLADMIN_PATH}" -u ${DB_USER}`;
    
    // Add password if present
    if (DB_PASS) {
      connectCmd += ` -p${DB_PASS}`;
    }
    
    connectCmd += ` -h ${DB_HOST}`;
    
    // Add port if not default
    if (DB_PORT && DB_PORT !== '3306') {
      connectCmd += ` -P ${DB_PORT}`;
    }
    
    connectCmd += ' ping';
    
    // Test connection
    execSync(connectCmd, { stdio: 'pipe' });
    console.log('✅ Koneksi ke MySQL berhasil');
    
    // Buat database jika belum ada
    console.log(`🛢️ Membuat database "${DB_NAME}"...`);
    
    let createCmd = `"${MYSQL_PATH}" -u ${DB_USER}`;
    
    // Add password if present
    if (DB_PASS) {
      createCmd += ` -p${DB_PASS}`;
    }
    
    createCmd += ` -h ${DB_HOST}`;
    
    // Add port if not default
    if (DB_PORT && DB_PORT !== '3306') {
      createCmd += ` -P ${DB_PORT}`;
    }
    
    createCmd += ` -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME};"`;
    
    execSync(createCmd, { stdio: 'pipe' });
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
  console.log('=== MySQL Database Migration Helper ===');
  console.log(`Using database: ${DB_HOST}:${DB_PORT}/${DB_NAME}`);
  
  // Langkah 1: Cek keberadaan file MySQL
  if (!fs.existsSync(MYSQL_PATH)) {
    console.error(`❌ MySQL tidak ditemukan di ${MYSQL_PATH}`);
    console.log('⚠️ Pastikan MySQL sudah terinstall di lokasi yang benar atau ubah MYSQL_PATH di environment variables');
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