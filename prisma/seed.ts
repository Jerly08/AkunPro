import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create admin user if it doesn't exist
  const adminExists = await prisma.user.findFirst({
    where: { email: 'admin@akunpro.com' }
  });

  if (!adminExists) {
    const hashedPassword = await hash('admin123', 10);
    await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@akunpro.com',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log('Admin user created');
  }

  // Create regular user if it doesn't exist
  const userExists = await prisma.user.findFirst({
    where: { email: 'user@example.com' }
  });

  if (!userExists) {
    const hashedPassword = await hash('user123', 10);
    await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'user@example.com',
        password: hashedPassword,
        role: 'USER',
      },
    });
    console.log('Test user created');
  }

  // Get user IDs for chat messages
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@akunpro.com' }
  });
  const user = await prisma.user.findFirst({
    where: { email: 'user@example.com' }
  });

  if (admin && user) {
    // Delete any existing chat messages for clean slate
    try {
      // Check if table exists
      await prisma.$executeRawUnsafe(`SELECT 1 FROM chat_messages LIMIT 1`);
      // If it exists, delete all records
      await prisma.$executeRawUnsafe(`DELETE FROM chat_messages`);
      console.log('Existing chat messages deleted');
    } catch (error) {
      console.log('Chat messages table might not exist yet, creating it...');
    }

    // Create sample chat conversation
    const messages = [
      {
        userId: user.id,
        content: 'Halo, saya butuh bantuan dengan akun Netflix saya',
        isFromAdmin: false,
        isRead: true,
        createdAt: new Date(Date.now() - 3600000 * 5) // 5 hours ago
      },
      {
        userId: user.id,
        content: 'Bagaimana cara mengakses profil Netflix yang sudah saya beli?',
        isFromAdmin: false,
        isRead: true,
        createdAt: new Date(Date.now() - 3600000 * 4.9) // 4.9 hours ago
      },
      {
        userId: user.id,
        content: 'Admin, apakah Anda online?',
        isFromAdmin: false,
        isRead: true,
        createdAt: new Date(Date.now() - 3600000 * 4) // 4 hours ago
      },
      {
        userId: user.id,
        content: 'Mohon bantuannya',
        isFromAdmin: false,
        isRead: true,
        createdAt: new Date(Date.now() - 3600000 * 3) // 3 hours ago
      },
      {
        userId: user.id,
        content: 'Maaf admin, saya masih menunggu respon',
        isFromAdmin: false,
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 1) // 1 hour ago
      },
      {
        userId: admin.id,
        content: 'Mohon maaf atas keterlambatan respons. Apa yang bisa kami bantu?',
        isFromAdmin: true,
        isRead: false,
        createdAt: new Date() // just now
      },
    ];

    try {
      // Try to create messages
      for (const message of messages) {
        // @ts-ignore - This is for seeding only
        await prisma.chatMessage.create({
          data: message
        });
      }
      console.log(`${messages.length} chat messages created successfully`);
    } catch (error) {
      console.error('Error creating chat messages:', error);
      
      // Try manual SQL approach if prisma model isn't available yet
      try {
        // Create the table if it doesn't exist
        await prisma.$executeRawUnsafe(`
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
        
        // Insert sample messages
        for (const message of messages) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO chat_messages (id, userId, content, isRead, isFromAdmin, createdAt)
            VALUES (UUID(), ?, ?, ?, ?, ?)
          `, message.userId, message.content, message.isRead ? 1 : 0, message.isFromAdmin ? 1 : 0, message.createdAt);
        }
        console.log(`${messages.length} chat messages created via raw SQL`);
      } catch (sqlError) {
        console.error('Failed to create messages via SQL:', sqlError);
      }
    }
  }

  console.log('Database seed completed.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 