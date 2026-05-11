const prisma = require('../prismaClient');

const allowedFilterFields = ['status', 'category', 'location', 'building', 'floor', 'room', 'priority'];
const textFilterFields = ['location', 'building', 'floor', 'room'];

const issueListOptions = (where = {}) => ({
  where,
  orderBy: { updatedAt: 'desc' },
  include: {
    user: true,
    comments: true
  }
});

const getAllIssues = () => prisma.issue.findMany(issueListOptions());

const getFilteredIssues = (filters) => {
  const where = {};

  for (const field of allowedFilterFields) {
    if (filters[field]) {
      where[field] = textFilterFields.includes(field)
        ? { contains: filters[field], mode: 'insensitive' }
        : filters[field];
    }
  }

  return prisma.issue.findMany(issueListOptions(where));
};

const searchIssues = (query) => {
  return prisma.issue.findMany(
    issueListOptions({
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { location: { contains: query, mode: 'insensitive' } },
        { building: { contains: query, mode: 'insensitive' } },
        { room: { contains: query, mode: 'insensitive' } }
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
