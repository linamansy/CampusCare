const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'test@campuscare.test';
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      isVerified: true,
      isActive: true,
    },
    create: {
      email,
      name: 'Verified Tester',
      password: hashedPassword,
      role: 'Community Member',
      isVerified: true,
      isActive: true,
    },
  });

  console.log('User created/updated:', user.email);
  console.log('Password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
