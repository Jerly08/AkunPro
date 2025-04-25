const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Periksa apakah admin sudah ada
  const adminExists = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!adminExists) {
    // Buat password hash
    const password = await hash('admin123456', 10);
    
    // Buat user admin
    const admin = await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@akunpro.com',
        password: password,
        role: 'ADMIN'
      }
    });
    
    console.log('Admin user created:', admin.email);
  } else {
    console.log('Admin user already exists');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });