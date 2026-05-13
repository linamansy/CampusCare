const fs = require('fs/promises');
const path = require('path');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');

const app = require('../src/app');
const prisma = require('../src/prismaClient');

const projectRoot = path.join(__dirname, '..');
const PORT = Number(process.env.VERIFY_PORT || 3100);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || 'campuscare-dev-secret-change-me';

const request = async (url, options = {}) => {
  const response = await fetch(`${BASE_URL}${url}`, options);
  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';
  const body = text && contentType.includes('application/json') ? JSON.parse(text) : text;

  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${url} failed with ${response.status}: ${text}`);
  }

  return body;
};

const main = async () => {
  const server = await new Promise((resolve) => {
    const instance = app.listen(PORT, () => resolve(instance));
  });

  const stamp = Date.now();
  const reporterEmail = `verify-reporter-${stamp}@campuscare.test`;
  const workerEmail = `verify-worker-${stamp}@campuscare.test`;
  let reporter;
  let worker;
  let issue;

  try {
    await request('/');

    reporter = await prisma.user.create({
      data: {
        name: 'Backend Verification Reporter',
        email: reporterEmail,
        password: 'not-used',
        role: 'Community Member',
        isActive: true,
        isVerified: true
      }
    });

    worker = await prisma.user.create({
      data: {
        name: 'Backend Verification Worker',
        email: workerEmail,
        password: 'not-used',
        role: 'Worker',
        isActive: true,
        isVerified: true
      }
    });

    issue = await prisma.issue.create({
      data: {
        title: 'Backend verification issue',
        description: 'Disposable issue for worker backend verification',
        category: 'Maintenance',
        location: 'Verification Lab',
        building: 'V',
        floor: '1',
        room: 'Lab',
        userId: reporter.id,
        assignedTo: worker.id,
        status: 'Assigned'
      }
    });

    const workerToken = jwt.sign(
      { id: worker.id, email: worker.email, role: worker.role, jti: randomUUID() },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const auth = { Authorization: `Bearer ${workerToken}` };

    const assignedIssues = await request(`/issues/assigned?workerId=${worker.id}`, {
      headers: auth
    });
    if (!assignedIssues.some((assignedIssue) => assignedIssue.id === issue.id)) {
      throw new Error('Assigned issue was not returned for the worker');
    }

    const inProgressIssue = await request(`/issues/${issue.id}/in-progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({ workerId: worker.id })
    });
    if (inProgressIssue.status !== 'In Progress') {
      throw new Error('Issue status was not updated to In Progress');
    }

    const comment = await request('/issues/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: JSON.stringify({
        text: 'Verification comment from worker',
        issueId: issue.id,
        workerId: worker.id
      })
    });
    const savedComment = comment.data || comment;
    if (savedComment.issueId !== issue.id) {
      throw new Error('Comment was not attached to the verification issue');
    }

    const formData = new FormData();
    formData.append('workerId', String(worker.id));
    formData.append('completionPhoto', new Blob(['verification-photo'], { type: 'image/png' }), 'verify.png');

    const photoIssue = await request(`/issues/${issue.id}/completion-photo`, {
      method: 'POST',
      headers: auth,
      body: formData
    });
    if (!photoIssue.completionPhotoUrl) {
      throw new Error('Completion photo URL was not saved');
    }

    const photoResponse = await fetch(`${BASE_URL}${photoIssue.completionPhotoUrl}`);
    if (!photoResponse.ok) {
      throw new Error(`Uploaded completion photo was not served: ${photoResponse.status}`);
    }

    await fs.rm(path.join(projectRoot, photoIssue.completionPhotoUrl.replace(/^\//, '')), { force: true });

    console.log('Worker issue backend verification passed');
  } finally {
    const userIds = [reporter?.id, worker?.id].filter(Boolean);
    if (issue?.id || userIds.length) {
      await prisma.notification.deleteMany({
        where: {
          OR: [
            ...(issue?.id ? [{ issueId: issue.id }] : []),
            ...(userIds.length ? [{ userId: { in: userIds } }] : [])
          ]
        }
      });
    }
    if (issue) {
      await prisma.comment.deleteMany({ where: { issueId: issue.id } });
      await prisma.issue.deleteMany({ where: { id: issue.id } });
    }

    if (reporter) {
      await prisma.user.deleteMany({ where: { id: reporter.id } });
    }
    if (worker) {
      await prisma.user.deleteMany({ where: { id: worker.id } });
    }

    await prisma.$disconnect();
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
};

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
