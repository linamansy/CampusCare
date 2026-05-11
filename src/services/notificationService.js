const prisma = require('../prismaClient');

const createNotification = async ({ userId, type, title, message, issueId = null }, tx = prisma) => {
  if (!userId) {
    return null;
  }

  return tx.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      issueId
    }
  });
};

const notifyRole = async ({ role, type, title, message, issueId = null }, tx = prisma) => {
  const users = await tx.user.findMany({
    where: { role, isActive: true },
    select: { id: true }
  });

  if (users.length === 0) {
    return [];
  }

  await tx.notification.createMany({
    data: users.map((user) => ({
      userId: user.id,
      type,
      title,
      message,
      issueId
    }))
  });

  return users;
};

module.exports = {
  createNotification,
  notifyRole
};
