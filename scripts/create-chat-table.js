// Script to create chat_messages table directly using MySQL
const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  console.log('Creating chat_messages table directly with MySQL...');
  
  try {
    // Menggunakan koneksi langsung ke database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // Ganti dengan password MySQL Anda jika ada
      database: 'netflix_spotify_marketplace',
      port: 3306
    });
    
    console.log('Connected to MySQL database');
    
    // Create chat_messages table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id VARCHAR(191) NOT NULL PRIMARY KEY,
        userId VARCHAR(191) NOT NULL,
        content TEXT NOT NULL,
        isRead BOOLEAN NOT NULL DEFAULT false,
        isFromAdmin BOOLEAN NOT NULL DEFAULT false,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    console.log('chat_messages table created successfully');
    
    // Get sample user IDs
    const [adminRows] = await connection.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      ['admin@akunpro.com']
    );
    
    const [userRows] = await connection.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      ['user@example.com']
    );
    
    // If users don't exist, create them
    let adminId, userId;
    
    if (adminRows.length === 0) {
      console.log('Creating admin user...');
      // Not implementing password hashing here for simplicity
      // In real app, use bcrypt for password hashing
      const [result] = await connection.execute(
        'INSERT INTO users (id, name, email, password, role, createdAt, updatedAt) VALUES (UUID(), ?, ?, ?, ?, NOW(), NOW())',
        ['Admin', 'admin@akunpro.com', '$2a$10$asTbXR.t5W9Cd.WA8BPQtOq2xLUc4vEkI.nI.2z1k3R74ExbuhXWy', 'ADMIN']
      );
      
      // Get the inserted ID
      const [rows] = await connection.execute(
        'SELECT id FROM users WHERE email = ? LIMIT 1',
        ['admin@akunpro.com']
      );
      adminId = rows[0].id;
    } else {
      adminId = adminRows[0].id;
    }
    
    if (userRows.length === 0) {
      console.log('Creating test user...');
      const [result] = await connection.execute(
        'INSERT INTO users (id, name, email, password, role, createdAt, updatedAt) VALUES (UUID(), ?, ?, ?, ?, NOW(), NOW())',
        ['Test User', 'user@example.com', '$2a$10$UbUZFnAVQAScxoOqI3DGQ.XQwBUYJHBCWwzk4IoL2b8wfyCQoI.vK', 'USER']
      );
      
      // Get the inserted ID
      const [rows] = await connection.execute(
        'SELECT id FROM users WHERE email = ? LIMIT 1',
        ['user@example.com']
      );
      userId = rows[0].id;
    } else {
      userId = userRows[0].id;
    }
    
    // Clear existing chat messages
    await connection.execute('DELETE FROM chat_messages');
    
    // Sample messages
    const messages = [
      {
        userId,
        content: 'Halo, saya butuh bantuan dengan akun Netflix saya',
        isFromAdmin: false,
        isRead: true,
        createdAt: new Date(Date.now() - 3600000 * 5) // 5 hours ago
      },
      {
        userId,
        content: 'Bagaimana cara mengakses profil Netflix yang sudah saya beli?',
        isFromAdmin: false,
        isRead: true,
        createdAt: new Date(Date.now() - 3600000 * 4.9) // 4.9 hours ago
      },
      {
        userId,
        content: 'Admin, apakah Anda online?',
        isFromAdmin: false,
        isRead: true,
        createdAt: new Date(Date.now() - 3600000 * 4) // 4 hours ago
      },
      {
        userId,
        content: 'Mohon bantuannya',
        isFromAdmin: false,
        isRead: true,
        createdAt: new Date(Date.now() - 3600000 * 3) // 3 hours ago
      },
      {
        userId,
        content: 'Maaf admin, saya masih menunggu respon',
        isFromAdmin: false,
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 1) // 1 hour ago
      },
      {
        userId: adminId,
        content: 'Mohon maaf atas keterlambatan respons. Apa yang bisa kami bantu?',
        isFromAdmin: true,
        isRead: false,
        createdAt: new Date() // just now
      },
    ];
    
    // Insert sample messages
    for (const message of messages) {
      await connection.execute(
        'INSERT INTO chat_messages (id, userId, content, isRead, isFromAdmin, createdAt) VALUES (UUID(), ?, ?, ?, ?, ?)',
        [message.userId, message.content, message.isRead ? 1 : 0, message.isFromAdmin ? 1 : 0, message.createdAt]
      );
    }
    
    console.log(`${messages.length} chat messages created successfully`);
    
    // Close connection
    await connection.end();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 