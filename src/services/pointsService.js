const prisma = require('../prismaClient');

const addPoints = async (userId, pointsToAdd) => {
  if (!userId || typeof pointsToAdd !== 'number') {
    throw new Error('Invalid points update');
  }

  return prisma.user.update({
    where: { id: userId },
    data: { points: { increment: pointsToAdd } }
  });
};

module.exports = {
  addPoints
};