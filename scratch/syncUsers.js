const prisma = require('../src/prismaClient');

async function main() {
  console.log('Syncing users...');
  
  try {
    // 1. Verify all users
    const verifyResult = await prisma.user.updateMany({
      data: { isVerified: true }
    });
    console.log(`Verified ${verifyResult.count} users.`);

    // 2. Standardize roles (Facility Management -> Facility Manager)
    const roleResult = await prisma.user.updateMany({
      where: { role: 'Facility Management' },
      data: { role: 'Facility Manager' }
    });
    console.log(`Standardized role for ${roleResult.count} users.`);

    console.log('Sync complete.');
  } catch (err) {
    console.error('Error during sync:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
