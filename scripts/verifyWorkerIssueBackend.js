const fs = require('fs/promises');
const path = require('path');

const app = require('../src/app');
const prisma = require('../src/prismaClient');

const projectRoot = path.join(__dirname, '..');
const PORT = Number(process.env.VERIFY_PORT || 3100);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const workerId = Number(process.env.VERIFY_WORKER_ID || 8);

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

  const email = `verify-worker-${Date.now()}@campuscare.test`;
  let user;
  let issue;

  try {
    await request('/');

    user = await prisma.user.create({
      data: {
        name: 'Backend Verification User',
        email,
        password: 'not-used',
        role: 'student'
      }
    });

    issue = await prisma.issue.create({
      data: {
        title: 'Backend verification issue',
        description: 'Disposable issue for worker backend verification',
        category: 'maintenance',
        location: 'Verification Lab',
        userId: user.id,
        assignedTo: workerId
      }
    });

    const assignedIssues = await request(`/issues/assigned?workerId=${workerId}`);
    if (!assignedIssues.some((assignedIssue) => assignedIssue.id === issue.id)) {
      throw new Error('Assigned issue was not returned for the worker');
    }

    const inProgressIssue = await request(`/issues/${issue.id}/in-progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workerId })
    });
    if (inProgressIssue.status !== 'In Progress') {
      throw new Error('Issue status was not updated to In Progress');
    }

    const comment = await request('/issues/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Verification comment from worker',
        issueId: issue.id,
        workerId
      })
    });
    if (comment.issueId !== issue.id) {
      throw new Error('Comment was not attached to the verification issue');
    }

    const formData = new FormData();
    formData.append('workerId', String(workerId));
    formData.append('photo', new Blob(['verification-photo'], { type: 'image/png' }), 'verify.png');

    const photoIssue = await request(`/issues/${issue.id}/completion-photo`, {
      method: 'POST',
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
    if (issue) {
      await prisma.comment.deleteMany({ where: { issueId: issue.id } });
      await prisma.issue.deleteMany({ where: { id: issue.id } });
    }

    if (user) {
      await prisma.user.deleteMany({ where: { id: user.id } });
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
