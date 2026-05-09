const prisma = require('../prismaClient');

const allowedFilterFields = ['status', 'category', 'location'];

const issueListOptions = (where = {}) => ({
  where,
  orderBy: { updatedAt: 'desc' },
  include: {
    user: true,
    comments: true
  }
});

const getAllIssues = () => {
  return prisma.issue.findMany(issueListOptions());
};

const getFilteredIssues = (filters) => {
  const where = {};

  // Dynamic filters keep one Prisma query path for status/category/location
  // and avoid touching existing issue or worker routes during merges.
  for (const field of allowedFilterFields) {
    if (filters[field]) {
      where[field] = filters[field];
    }
  }

  return prisma.issue.findMany(issueListOptions(where));
};

const searchIssues = (query) => {
  return prisma.issue.findMany(
    issueListOptions({
      // Search is isolated to manager routes and checks both manager-facing text fields.
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ]
    })
  );
};

module.exports = {
  allowedFilterFields,
  getAllIssues,
  getFilteredIssues,
  searchIssues
};
