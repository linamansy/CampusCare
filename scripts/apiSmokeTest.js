const app = require('../src/app');
const prisma = require('../src/prismaClient');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const path = require('path');
const fs = require('fs/promises');
const { setTimeout: sleep } = require('timers/promises');

const PORT = Number(process.env.SMOKE_PORT || 3300);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || 'campuscare-dev-secret-change-me';

const request = async (url, options = {}) => {
  const response = await fetch(`${BASE_URL}${url}`, options);
  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';
  const body = text && contentType.includes('application/json') ? JSON.parse(text) : text;
  return { response, body, raw: text };
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const tokenFor = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, jti: randomUUID() },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const safeUnlink = async (relativePath) => {
  try {
    const clean = relativePath.replace(/^\//, '');
    const fullPath = path.join(__dirname, '..', clean);
    await fs.rm(fullPath, { force: true });
  } catch {
    // ignore
  }
};

const main = async () => {
  const server = await new Promise((resolve) => {
    const instance = app.listen(PORT, () => resolve(instance));
  });

  const created = {
    users: [],
    issues: []
  };

  try {
    // Basic checks
    {
      const { response } = await request('/health');
      assert(response.status === 200, '/health should return 200');
    }

    // Create users directly (so we can test RBAC without needing an existing admin seed).
    const stamp = Date.now();
    const admin = await prisma.user.create({
      data: {
        name: 'Smoke Admin',
        email: `smoke-admin-${stamp}@campuscare.test`,
        password: 'hashed-or-not-used',
        role: 'Admin',
        isActive: true,
        isVerified: true
      }
    });
    const manager = await prisma.user.create({
      data: {
        name: 'Smoke Manager',
        email: `smoke-manager-${stamp}@campuscare.test`,
        password: 'hashed-or-not-used',
        role: 'Facility Manager',
        isActive: true,
        isVerified: true
      }
    });
    const worker = await prisma.user.create({
      data: {
        name: 'Smoke Worker',
        email: `smoke-worker-${stamp}@campuscare.test`,
        password: 'hashed-or-not-used',
        role: 'Worker',
        isActive: true,
        isVerified: true
      }
    });
    const member = await prisma.user.create({
      data: {
        name: 'Smoke Member',
        email: `smoke-member-${stamp}@campuscare.test`,
        password: 'hashed-or-not-used',
        role: 'Community Member',
        isActive: true,
        isVerified: true
      }
    });
    created.users.push(admin, manager, worker, member);

    const adminToken = tokenFor(admin);
    const managerToken = tokenFor(manager);
    const workerToken = tokenFor(worker);
    const memberToken = tokenFor(member);

    // Auth routes: register/login should work for non-admin roles
    {
      const email = `smoke-register-${stamp}@giu-uni.de`;
      const { response: regRes } = await request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Smoke Register',
          email,
          password: '123456',
          role: 'Community Member'
        })
      });
      assert(regRes.status === 201 || regRes.status === 409, 'register should create or conflict');

      const { response: loginRes, body: loginBody, raw } = await request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: '123456' })
      });
      assert(loginRes.status === 200, `login should succeed: ${raw}`);
      assert(typeof loginBody?.accessToken === 'string', 'login should return accessToken');
    }

    // Issue creation (member only) + list + get by id
    let issue;
    let completionIssue;
    let rejectIssue;
    {
      const createIssue = async (suffix) => {
        const formData = new FormData();
        formData.append('title', `Smoke issue ${suffix}`);
        formData.append('description', `Smoke description ${suffix}`);
        formData.append('category', 'Maintenance');
        formData.append('building', 'Building S');
        formData.append('floor', '1');
        formData.append('room', String((stamp % 100000) + suffix));
        formData.append('location', `Smoke Location ${stamp} ${suffix}`);
        formData.append('image', new Blob(['x'], { type: 'image/png' }), `issue-${suffix}.png`);

        const { response: createRes, body: createBody, raw } = await request('/api/issues', {
          method: 'POST',
          headers: { ...authHeaders(memberToken) },
          body: formData
        });
        assert(createRes.status === 201, `create issue should return 201: ${raw}`);
        assert(createBody?.data?.id, 'create issue should return data.id');
        created.issues.push(createBody.data);
        return createBody.data;
      };

      issue = await createIssue(1);
      completionIssue = await createIssue(2);
      rejectIssue = await createIssue(3);

      const { response: listRes } = await request('/api/issues');
      assert(listRes.status === 200, 'GET /api/issues should return 200');

      const { response: getRes } = await request(`/api/issues/${issue.id}`);
      assert(getRes.status === 200, 'GET /api/issues/:id should return 200');
    }

    // Worker endpoints (assigned list + in-progress)
    {
      await prisma.issue.update({
        where: { id: issue.id },
        data: { assignedTo: worker.id }
      });
      await prisma.issue.update({
        where: { id: completionIssue.id },
        data: { assignedTo: worker.id }
      });

      const { response: assignedRes } = await request(`/api/issues/assigned?workerId=${worker.id}`, {
        headers: { ...authHeaders(workerToken) }
      });
      assert(assignedRes.status === 200, 'GET /api/issues/assigned should return 200');

      const { response: inProgRes, body: inProgBody, raw } = await request(`/api/issues/${issue.id}/in-progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders(workerToken) },
        body: JSON.stringify({ workerId: worker.id })
      });
      assert(inProgRes.status === 200, `PUT /in-progress should return 200: ${raw}`);
      assert(inProgBody?.status === 'In Progress', 'in-progress should set status');

      const { response: inProgRes2 } = await request(`/api/issues/${completionIssue.id}/in-progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders(workerToken) },
        body: JSON.stringify({ workerId: worker.id })
      });
      assert(inProgRes2.status === 200, 'PUT /in-progress should work for second issue');

      const { response: completedRes, body: completedBody, raw: completedRaw } = await request(`/api/issues/${completionIssue.id}/completed`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders(workerToken) },
        body: JSON.stringify({ workerId: worker.id })
      });
      assert(completedRes.status === 200, `PUT /completed should return 200: ${completedRaw}`);
      assert(completedBody?.status === 'Completed', 'completed should set status');
    }

    // Comments (both routes exist); verify at least one path works
    {
      const { response: commentRes } = await request('/api/issues/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(workerToken) },
        body: JSON.stringify({ text: 'Smoke comment', issueId: issue.id, workerId: worker.id })
      });
      assert(commentRes.status === 201, 'POST /api/issues/comments should return 201');
    }

    // Completion photo upload
    {
      const formData = new FormData();
      formData.append('workerId', String(worker.id));
      formData.append('completionPhoto', new Blob(['smoke-photo'], { type: 'image/png' }), 'smoke.png');

      const { response: photoRes, body: photoBody, raw } = await request(`/api/issues/${issue.id}/completion-photo`, {
        method: 'POST',
        headers: { ...authHeaders(workerToken) },
        body: formData
      });
      assert(photoRes.status === 200, `completion photo should return 200: ${raw}`);
      assert(typeof photoBody?.completionPhotoUrl === 'string', 'completion photo should set completionPhotoUrl');

      const { response: servedRes } = await request(photoBody.completionPhotoUrl);
      assert(servedRes.status === 200, 'uploaded completion photo should be served');

      await safeUnlink(photoBody.completionPhotoUrl);
    }

    // Notifications
    {
      const { response: notifRes, body: notifBody } = await request('/api/notifications', {
        headers: authHeaders(memberToken)
      });
      assert(notifRes.status === 200, 'GET /api/notifications should return 200');
      assert(Array.isArray(notifBody?.data), 'notifications response should include data array');

      const firstNotification = notifBody.data[0];
      if (firstNotification) {
        const { response: readRes } = await request(`/api/notifications/${firstNotification.id}/read`, {
          method: 'PUT',
          headers: authHeaders(memberToken)
        });
        assert(readRes.status === 200, 'PUT /api/notifications/:id/read should return 200');
      }

      const { response: readAllRes } = await request('/api/notifications/read-all', {
        method: 'PUT',
        headers: authHeaders(memberToken)
      });
      assert(readAllRes.status === 200, 'PUT /api/notifications/read-all should return 200');
    }

    // Manager routes (require Manager/Admin)
    {
      const { response: forbidRes } = await request('/api/manager/issues', {
        headers: authHeaders(workerToken)
      });
      assert(forbidRes.status === 403, 'worker should be forbidden from manager routes');

      const { response: mgrRes } = await request('/api/manager/issues', {
        headers: authHeaders(managerToken)
      });
      assert(mgrRes.status === 200, 'manager should access /api/manager/issues');

      const { response: rejectRes } = await request(`/api/manager/issues/${rejectIssue.id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders(managerToken) },
        body: JSON.stringify({ reason: 'Smoke reject reason' })
      });
      assert(rejectRes.status === 200, 'manager should be able to reject issues');

      await prisma.issue.update({
        where: { id: issue.id },
        data: { status: 'Under Review' }
      });

      const { response: reworkRes } = await request(`/api/manager/issues/${issue.id}/rework`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders(managerToken) },
        body: JSON.stringify({ reason: 'Smoke rework reason' })
      });
      assert(reworkRes.status === 200, 'manager should be able to request rework');
    }

    // Admin routes (require Admin)
    {
      const { response: forbidRes } = await request('/api/admin/users', {
        headers: authHeaders(managerToken)
      });
      assert(forbidRes.status === 403, 'manager should be forbidden from admin routes');

      const { response: adminRes } = await request('/api/admin/users', {
        headers: authHeaders(adminToken)
      });
      assert(adminRes.status === 200, 'admin should access /api/admin/users');
    }

    // User routes (admin-only)
    {
      const { response: usersRes } = await request('/api/users', {
        headers: authHeaders(adminToken)
      });
      assert(usersRes.status === 200, 'admin should access /api/users');
    }

    // Give the server a beat to flush any pending I/O
    await sleep(50);

    console.log('API smoke test passed');
  } finally {
    try {
      if (created.issues.length > 0) {
        const issueIds = created.issues.map((i) => i.id);
        await prisma.comment.deleteMany({ where: { issueId: { in: issueIds } } });
        await prisma.issue.deleteMany({ where: { id: { in: issueIds } } });
      }
      if (created.users.length > 0) {
        await prisma.user.deleteMany({ where: { id: { in: created.users.map((u) => u.id) } } });
      }
    } catch {
      // ignore cleanup failures
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

