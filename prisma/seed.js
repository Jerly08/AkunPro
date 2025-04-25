const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Buat admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        name: 'Admin',
        email: 'admin@example.com',
        password: adminPassword,
        role: 'ADMIN',
      },
    });
    console.log('Admin user created:', admin);

    // Tambahkan admin baru dengan username 'admin'
    const newAdminPassword = await bcrypt.hash('password123', 10);
    const newAdmin = await prisma.user.upsert({
      where: { email: 'admin@akunpro.com' },
      update: {},
      create: {
        name: 'Admin Akunpro',
        email: 'admin@akunpro.com',
        password: newAdminPassword,
        role: 'ADMIN',
      },
    });
    console.log('New admin user created:', newAdmin);

    // Buat beberapa user biasa
    const userPassword = await bcrypt.hash('user123', 10);
    const users = await Promise.all([
      prisma.user.upsert({
        where: { email: 'user1@example.com' },
        update: {},
        create: {
          name: 'User 1',
          email: 'user1@example.com',
          password: userPassword,
          role: 'USER',
        },
      }),
      prisma.user.upsert({
        where: { email: 'user2@example.com' },
        update: {},
        create: {
          name: 'User 2',
          email: 'user2@example.com',
          password: userPassword,
          role: 'USER',
        },
      }),
    ]);
    console.log('Users created:', users);

    // Tambahkan user baru
    const newUserPassword = await bcrypt.hash('user123', 10);
    const newUsers = await Promise.all([
      prisma.user.upsert({
        where: { email: 'budi@gmail.com' },
        update: {},
        create: {
          name: 'Budi Santoso',
          email: 'budi@gmail.com',
          password: newUserPassword,
          role: 'USER',
        },
      }),
      prisma.user.upsert({
        where: { email: 'ani@gmail.com' },
        update: {},
        create: {
          name: 'Ani Wijaya',
          email: 'ani@gmail.com',
          password: newUserPassword,
          role: 'USER',
        },
      }),
      prisma.user.upsert({
        where: { email: 'deni@gmail.com' },
        update: {},
        create: {
          name: 'Deni Rahmat',
          email: 'deni@gmail.com',
          password: newUserPassword,
          role: 'USER',
        },
      }),
    ]);
    console.log('New users created:', newUsers);

    // Buat beberapa akun Netflix dengan pilihan durasi yang beragam
    const netflixAccounts = [
      // Akun Netflix 1 Bulan
      {
        type: 'NETFLIX',
        accountEmail: 'netflix_1m_a@example.com',
        accountPassword: 'netflix123',
        isActive: true,
        price: 45000,
        description: 'Netflix Premium 1 bulan, 4K Ultra HD, 4 device. Nikmati film dan serial TV favorit Anda dengan kualitas terbaik.',
        warranty: 30, // 30 hari
        duration: 1, // 1 bulan
        stock: 5, // Stok tersedia
        sellerId: admin.id,
      },
      {
        type: 'NETFLIX',
        accountEmail: 'netflix_1m_b@example.com',
        accountPassword: 'netflix456',
        isActive: true,
        price: 45000,
        description: 'Netflix Premium 1 bulan, 4K Ultra HD, 4 device. Akun pribadi dengan jaminan tidak akan dibagikan kepada pengguna lain.',
        warranty: 30, // 30 hari
        duration: 1, // 1 bulan
        stock: 3, // Stok tersedia
        sellerId: admin.id,
      },
      
      // Akun Netflix 2 Bulan
      {
        type: 'NETFLIX',
        accountEmail: 'netflix_2m_a@example.com',
        accountPassword: 'netflix789',
        isActive: true,
        price: 85000,
        description: 'Netflix Premium 2 bulan, 4K Ultra HD, 4 device. Hemat dengan berlangganan lebih lama.',
        warranty: 60, // 60 hari
        duration: 2, // 2 bulan
        stock: 5, // Stok tersedia
        sellerId: admin.id,
      },
      {
        type: 'NETFLIX',
        accountEmail: 'netflix_2m_b@example.com',
        accountPassword: 'netflix101112',
        isActive: true,
        price: 85000,
        description: 'Netflix Premium 2 bulan, 4K Ultra HD, 4 device. Akses ke semua konten Netflix termasuk film dan serial eksklusif.',
        warranty: 60, // 60 hari
        duration: 2, // 2 bulan
        stock: 4, // Stok tersedia
        sellerId: admin.id,
      },
      
      // Akun Netflix 3 Bulan
      {
        type: 'NETFLIX',
        accountEmail: 'netflix_3m_a@example.com',
        accountPassword: 'netflix131415',
        isActive: true,
        price: 120000,
        description: 'Netflix Premium 3 bulan, 4K Ultra HD, 4 device. Penawaran terbaik untuk hiburan jangka panjang.',
        warranty: 90, // 90 hari
        duration: 3, // 3 bulan
        stock: 3, // Stok tersedia
        sellerId: admin.id,
      },
      {
        type: 'NETFLIX',
        accountEmail: 'netflix_3m_b@example.com',
        accountPassword: 'netflix161718',
        isActive: true,
        price: 120000,
        description: 'Netflix Premium 3 bulan, 4K Ultra HD, 4 device. Termasuk akses ke semua film dan serial terbaru.',
        warranty: 90, // 90 hari
        duration: 3, // 3 bulan
        stock: 2, // Stok tersedia
        sellerId: admin.id,
      },
      
      // Akun Netflix 6 Bulan
      {
        type: 'NETFLIX',
        accountEmail: 'netflix_6m_a@example.com',
        accountPassword: 'netflix192021',
        isActive: true,
        price: 220000,
        description: 'Netflix Premium 6 bulan, 4K Ultra HD, 4 device. Paket paling hemat untuk penggemar Netflix.',
        warranty: 180, // 180 hari
        duration: 6, // 6 bulan
        stock: 2, // Stok tersedia
        sellerId: admin.id,
      },
      {
        type: 'NETFLIX',
        accountEmail: 'netflix_6m_b@example.com',
        accountPassword: 'netflix222324',
        isActive: true,
        price: 220000,
        description: 'Netflix Premium 6 bulan, 4K Ultra HD, 4 device. Jaminan akun aktif selama 6 bulan penuh.',
        warranty: 180, // 180 hari
        duration: 6, // 6 bulan
        stock: 2, // Stok tersedia
        sellerId: admin.id,
      },
      
      // Tambahkan akun Netflix baru di bawah ini
      {
        type: 'NETFLIX',
        accountEmail: 'netflix_premium_1@netflix.com',
        accountPassword: 'NetflixPremium123',
        isActive: true,
        price: 45000,
        description: 'Netflix Premium 1 bulan, 4K Ultra HD, Akses ke semua konten eksklusif Netflix, garansi full selama masa aktif.',
        warranty: 30,
        duration: 1,
        stock: 10,
        sellerId: newAdmin.id,
      },
      {
        type: 'NETFLIX',
        accountEmail: 'netflix_premium_2@netflix.com',
        accountPassword: 'NetflixPremium456',
        isActive: true,
        price: 85000,
        description: 'Netflix Premium 2 bulan, 4K Ultra HD, Nonton di 4 device berbeda secara bersamaan, customer service 24/7.',
        warranty: 60,
        duration: 2,
        stock: 8,
        sellerId: newAdmin.id,
      },
      {
        type: 'NETFLIX',
        accountEmail: 'netflix_premium_3@netflix.com',
        accountPassword: 'NetflixPremium789',
        isActive: true,
        price: 120000,
        description: 'Netflix Premium 3 bulan, 4K Ultra HD, Semua film dan serial terbaru, download untuk ditonton offline.',
        warranty: 90,
        duration: 3,
        stock: 6,
        sellerId: newAdmin.id,
      },
      {
        type: 'NETFLIX',
        accountEmail: 'netflix_premium_6@netflix.com',
        accountPassword: 'NetflixPremium101112',
        isActive: true,
        price: 220000,
        description: 'Netflix Premium 6 bulan, 4K Ultra HD, Paket hemat terbaik, akses semua film & serial ekslusif, garansi full.',
        warranty: 180,
        duration: 6,
        stock: 4,
        sellerId: newAdmin.id,
      },
      {
        type: 'NETFLIX',
        accountEmail: 'netflix_uhd_1@netflix.com',
        accountPassword: 'NetflixUHD123',
        isActive: true,
        price: 50000,
        description: 'Netflix UHD Premium 1 bulan, 4K Ultra HD + Dolby Atmos, pengalaman menonton terbaik dengan kualitas tertinggi.',
        warranty: 30,
        duration: 1,
        stock: 5,
        sellerId: newAdmin.id,
      },
    ];

    console.log('Menambahkan akun Netflix baru...');
    // Gunakan upsert untuk menambahkan akun baru atau mengupdate jika sudah ada
    for (const account of netflixAccounts) {
      try {
        const existingAccount = await prisma.account.findFirst({
          where: { 
            accountEmail: account.accountEmail,
            type: 'NETFLIX'
          },
        });

        if (!existingAccount) {
          await prisma.account.create({
            data: account
          });
          console.log(`[CREATED] Netflix account: ${account.accountEmail}`);
        } else {
          console.log(`[SKIPPED] Netflix account already exists: ${account.accountEmail}`);
        }
      } catch (error) {
        console.error(`Error creating Netflix account ${account.accountEmail}:`, error.message);
      }
    }
    
    console.log('Netflix accounts processed: ', netflixAccounts.length, ' accounts');

    // Tambahkan profile untuk akun Netflix
    console.log('Menambahkan profile untuk akun Netflix...');
    
    // Profile standar Netflix (4 profile per akun)
    const profileTemplates = [
      { name: 'Profile 1', pin: null, isKids: false },
      { name: 'Profile 2', pin: null, isKids: false },
      { name: 'Profile 3', pin: null, isKids: false },
      { name: 'Kids', pin: null, isKids: true }
    ];

    // Untuk setiap akun Netflix, tambahkan profile
    for (const account of netflixAccounts) {
      try {
        // Cari akun yang berhasil dibuat
        const existingAccount = await prisma.account.findFirst({
          where: { 
            accountEmail: account.accountEmail,
            type: 'NETFLIX'
          },
          include: {
            profiles: true
          }
        });

        if (existingAccount) {
          // Jika akun sudah memiliki profile, skip
          if (existingAccount.profiles && existingAccount.profiles.length > 0) {
            console.log(`[SKIPPED] Profiles already exist for Netflix account: ${account.accountEmail}`);
            continue;
          }

          // Buat 4 profile untuk akun
          for (const profileTemplate of profileTemplates) {
            await prisma.netflixProfile.create({
              data: {
                ...profileTemplate,
                accountId: existingAccount.id
              }
            });
          }
          console.log(`[CREATED] 4 profiles for Netflix account: ${account.accountEmail}`);
        }
      } catch (error) {
        console.error(`Error creating profiles for Netflix account ${account.accountEmail}:`, error.message);
      }
    }

    // Update isActive = true untuk semua akun Netflix baru
    console.log('Mengaktifkan semua akun Netflix baru...');
    for (const account of netflixAccounts) {
      try {
        await prisma.account.updateMany({
          where: {
            accountEmail: account.accountEmail,
            type: 'NETFLIX'
          },
          data: {
            isActive: true
          }
        });
      } catch (error) {
        console.error(`Error activating Netflix account ${account.accountEmail}:`, error.message);
      }
    }

    // Buat beberapa akun Spotify
    const spotifyAccounts = [
      {
        type: 'SPOTIFY',
        accountEmail: 'spotify_1m_a@example.com',
        accountPassword: 'spotify123',
        isActive: true,
        price: 35000,
        description: 'Spotify Premium 1 bulan, Individual Plan',
        warranty: 30, // 30 hari
        duration: 1, // 1 bulan
        sellerId: admin.id,
      },
      {
        type: 'SPOTIFY',
        accountEmail: 'spotify_3m_a@example.com',
        accountPassword: 'spotify456',
        isActive: true,
        price: 90000,
        description: 'Spotify Premium 3 bulan, Family Plan (6 akun)',
        warranty: 90, // 90 hari
        duration: 3, // 3 bulan
        sellerId: admin.id,
      },
      {
        type: 'SPOTIFY',
        accountEmail: 'spotify_2m_a@example.com',
        accountPassword: 'spotify789',
        isActive: true,
        price: 60000,
        description: 'Spotify Premium 2 bulan, Duo Plan (2 akun)',
        warranty: 60, // 60 hari
        duration: 2, // 2 bulan
        sellerId: admin.id,
      },
      {
        type: 'SPOTIFY',
        accountEmail: 'spotify_6m_a@example.com',
        accountPassword: 'spotify101112',
        isActive: true,
        price: 160000,
        description: 'Spotify Premium 6 bulan, Individual Plan',
        warranty: 180, // 180 hari
        duration: 6, // 6 bulan
        sellerId: admin.id,
      },
    ];

    console.log('Menambahkan akun Spotify baru...');
    // Gunakan pendekatan aman untuk menambahkan akun Spotify
    for (const account of spotifyAccounts) {
      try {
        const existingAccount = await prisma.account.findFirst({
          where: { 
            accountEmail: account.accountEmail,
            type: 'SPOTIFY'
          },
        });

        if (!existingAccount) {
          await prisma.account.create({
            data: account
          });
          console.log(`[CREATED] Spotify account: ${account.accountEmail}`);
        } else {
          console.log(`[SKIPPED] Spotify account already exists: ${account.accountEmail}`);
        }
      } catch (error) {
        console.error(`Error creating Spotify account ${account.accountEmail}:`, error.message);
      }
    }
    
    console.log('Spotify accounts processed: ', spotifyAccounts.length, ' accounts');
    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 