const prisma = require('../prismaClient');

const findIssueAssignedToWorker = async (issueId, workerId) => {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId }
  });

  if (!issue) {
    return { error: { status: 404, message: 'Issue not found' } };
  }

  if (issue.assignedTo !== workerId) {
    return { error: { status: 403, message: 'Issue is not assigned to this worker' } };
  }

  return { issue };
};

module.exports = {
  findIssueAssignedToWorker
};
