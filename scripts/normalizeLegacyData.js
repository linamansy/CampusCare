const prisma = require('../src/prismaClient');

const LEGACY_ROLE_MAP = {
  'Community User': 'Community Member'
};

const LEGACY_STATUS_MAP = {
  Open: 'Submitted/Pending',
  Pending: 'Submitted/Pending'
};

const main = async () => {
  const updates = {
    roles: [],
    statuses: []
  };

  for (const [fromRole, toRole] of Object.entries(LEGACY_ROLE_MAP)) {
    const result = await prisma.user.updateMany({
      where: { role: fromRole },
      data: { role: toRole }
    });

    updates.roles.push({ fromRole, toRole, count: result.count });
  }

  for (const [fromStatus, toStatus] of Object.entries(LEGACY_STATUS_MAP)) {
    const result = await prisma.issue.updateMany({
      where: { status: fromStatus },
      data: { status: toStatus }
    });

    updates.statuses.push({ fromStatus, toStatus, count: result.count });
  }

  console.log(JSON.stringify(updates, null, 2));
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
