const app = require('../src/app');
const prisma = require('../src/prismaClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const path = require('path');
const fs = require('fs/promises');

const PORT = Number(process.env.BACKEND_AUDIT_PORT || 3402);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || 'campuscare-dev-secret-change-me';

const created = {
  users: [],
  issues: [],
  uploads: []
};

const failures = [];
const notes = [];
const progress = (label) => console.log(`[audit] ${label}`);

const tokenFor = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, jti: randomUUID() },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

const authHeaders = (token, extra = {}) => ({
  Authorization: `Bearer ${token}`,
  Connection: 'close',
  ...extra
});

const request = async (url, options = {}) => {
  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      Connection: 'close',
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';
  const body = text && contentType.includes('application/json') ? JSON.parse(text) : text;

  return { response, body, raw: text };
};

const check = (condition, message, details) => {
  if (!condition) {
    failures.push(details ? `${message}: ${details}` : message);
  }
};

const makeImage = (name) =>
  new Blob([`image-${name}`], { type: 'image/png' });

const createIssue = async (token, suffix) => {
  const formData = new FormData();
  formData.append('title', `Audit issue ${suffix}`);
  formData.append('description', `Audit description ${suffix}`);
  formData.append('category', 'Maintenance');
  formData.append('building', 'Engineering');
  formData.append('floor', '2');
  formData.append('room', `R-${suffix}`);
  formData.append('location', `Engineering Floor 2 Room ${suffix}`);
  formData.append('image', makeImage(`issue-${suffix}`), `issue-${suffix}.png`);

  const result = await request('/api/issues', {
    method: 'POST',
    headers: authHeaders(token),
    body: formData
  });

  if (result.body?.data?.id) {
    created.issues.push(result.body.data.id);
    if (result.body?.data?.image) {
      created.uploads.push(result.body.data.image);
    }
  }

  return result;
};

const main = async () => {
  const server = await new Promise((resolve, reject) => {
    const instance = app.listen(PORT, '127.0.0.1', () => resolve(instance));
    instance.on('error', reject);
  });

  try {
    const stamp = Date.now();
    progress('seed users');

    const admin = await prisma.user.create({
      data: {
        name: 'Audit Admin',
        email: `audit-admin-${stamp}@campuscare.test`,
        password: await bcrypt.hash('123456', 10),
        role: 'Admin',
        isActive: true,
        isVerified: true
      }
    });
    const manager = await prisma.user.create({
      data: {
        name: 'Audit Manager',
        email: `audit-manager-${stamp}@campuscare.test`,
        password: await bcrypt.hash('123456', 10),
        role: 'Facility Manager',
        isActive: true,
        isVerified: true
      }
    });
    const worker = await prisma.user.create({
      data: {
        name: 'Audit Worker',
        email: `audit-worker-${stamp}@campuscare.test`,
        password: await bcrypt.hash('123456', 10),
        role: 'Worker',
        isActive: true,
        isVerified: true
      }
    });
    const adminTarget = await prisma.user.create({
      data: {
        name: 'Audit Target',
        email: `audit-target-${stamp}@campuscare.test`,
        password: await bcrypt.hash('123456', 10),
        role: 'Worker',
        isActive: true,
        isVerified: true
      }
    });
    created.users.push(admin.id, manager.id, worker.id, adminTarget.id);

    const adminToken = tokenFor(admin);
    const managerToken = tokenFor(manager);
    const workerToken = tokenFor(worker);

    const health = await request('/health');
    check(health.response.status === 200, 'Health endpoint should return 200', health.raw);
    progress('auth flow');

    const registerEmail = `audit-member-${stamp}@giu-uni.de`;
    const register = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Connection: 'close' },
      body: JSON.stringify({
        name: 'Audit Member',
        email: registerEmail,
        password: '123456',
        role: 'Community Member'
      })
    });
    check(register.response.status === 201, 'Register should return 201', register.raw);
    const memberId = register.body?.user?.id;
    if (memberId) {
      created.users.push(memberId);
    }

    const badRegister = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Connection: 'close' },
      body: JSON.stringify({
        name: 'Bad Role',
        email: `audit-bad-${stamp}@giu-uni.de`,
        password: '123456',
        role: 'Admin'
      })
    });
    check(badRegister.response.status === 400, 'Public register should reject privileged roles', badRegister.raw);

    const login = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Connection: 'close' },
      body: JSON.stringify({ email: registerEmail, password: '123456' })
    });
    check(login.response.status === 200, 'Login should return 200', login.raw);
    const memberToken = login.body?.accessToken;
    check(Boolean(memberToken), 'Login should return accessToken');

    const me = await request('/api/auth/me', {
      headers: authHeaders(memberToken)
    });
    check(me.response.status === 200, 'Auth me should return 200', me.raw);

    const forgot = await request('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Connection: 'close' },
      body: JSON.stringify({ email: registerEmail })
    });
    check(forgot.response.status === 200, 'Forgot password should return 200', forgot.raw);
    const resetToken = forgot.body?.resetToken;
    check(Boolean(resetToken), 'Forgot password should return reset token in current implementation');

    const reset = await request('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Connection: 'close' },
      body: JSON.stringify({ token: resetToken, newPassword: '654321' })
    });
    check(reset.response.status === 200, 'Reset password should return 200', reset.raw);

    const oldLogin = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Connection: 'close' },
      body: JSON.stringify({ email: registerEmail, password: '123456' })
    });
    check(oldLogin.response.status === 401, 'Old password should stop working after reset', oldLogin.raw);

    const relogin = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Connection: 'close' },
      body: JSON.stringify({ email: registerEmail, password: '654321' })
    });
    check(relogin.response.status === 200, 'Login with reset password should work', relogin.raw);
    const refreshedMemberToken = relogin.body?.accessToken;

    const logout = await request('/api/auth/logout', {
      method: 'POST',
      headers: authHeaders(refreshedMemberToken)
    });
    check(logout.response.status === 200, 'Logout should return 200', logout.raw);

    const revokedMe = await request('/api/auth/me', {
      headers: authHeaders(refreshedMemberToken)
    });
    check(revokedMe.response.status === 401, 'Revoked token should fail auth', revokedMe.raw);

    const reloginAfterLogout = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Connection: 'close' },
      body: JSON.stringify({ email: registerEmail, password: '654321' })
    });
    check(reloginAfterLogout.response.status === 200, 'Member should be able to login again after logout', reloginAfterLogout.raw);
    const activeMemberToken = reloginAfterLogout.body?.accessToken;

    const issueOne = await createIssue(activeMemberToken, `${stamp}-1`);
    const issueTwo = await createIssue(activeMemberToken, `${stamp}-2`);
    const issueThree = await createIssue(activeMemberToken, `${stamp}-3`);
    check(issueOne.response.status === 201, 'Member should be able to submit issue with image', issueOne.raw);
    check(issueTwo.response.status === 201, 'Member should be able to submit second issue', issueTwo.raw);
    check(issueThree.response.status === 201, 'Member should be able to submit third issue', issueThree.raw);
    progress('issue creation');

    const issueOneId = issueOne.body?.data?.id;
    const issueTwoId = issueTwo.body?.data?.id;
    const issueThreeId = issueThree.body?.data?.id;

    const myIssues = await request('/api/issues/my', {
      headers: authHeaders(activeMemberToken)
    });
    check(myIssues.response.status === 200, 'Member my issues should return 200', myIssues.raw);

    const ownIssuesByQuery = await request(`/api/issues/user?userId=${memberId}`, {
      headers: authHeaders(activeMemberToken)
    });
    check(ownIssuesByQuery.response.status === 200, 'Member should fetch own issues by query route', ownIssuesByQuery.raw);

    const forbiddenQuery = await request(`/api/issues/user?userId=${worker.id}`, {
      headers: authHeaders(activeMemberToken)
    });
    check(forbiddenQuery.response.status === 403, 'Member should not fetch another user issues by query route', forbiddenQuery.raw);

    const forbiddenAssign = await request(`/api/issues/${issueOneId}/assign`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders(activeMemberToken) },
      body: JSON.stringify({ workerId: worker.id })
    });
    check(forbiddenAssign.response.status === 403, 'Member should not assign worker through legacy endpoint', forbiddenAssign.raw);

    const workerManagerView = await request('/api/manager/issues', {
      headers: authHeaders(workerToken)
    });
    check(workerManagerView.response.status === 403, 'Worker should be forbidden from manager routes', workerManagerView.raw);

    const managerAssign = await request(`/api/manager/issues/${issueOneId}/assign`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders(managerToken) },
      body: JSON.stringify({ workerId: worker.id })
    });
    check(managerAssign.response.status === 200, 'Manager should assign worker', managerAssign.raw);

    const managerPriority = await request(`/api/manager/issues/${issueOneId}/priority`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders(managerToken) },
      body: JSON.stringify({ priority: 'Urgent' })
    });
    check(managerPriority.response.status === 200, 'Manager should update priority', managerPriority.raw);

    const workerAssigned = await request('/api/issues/assigned', {
      headers: authHeaders(workerToken)
    });
    check(workerAssigned.response.status === 200, 'Worker assigned route should return 200', workerAssigned.raw);

    const workerInProgress = await request(`/api/issues/${issueOneId}/in-progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders(workerToken) },
      body: JSON.stringify({ workerId: worker.id })
    });
    check(workerInProgress.response.status === 200, 'Worker should move assigned issue to In Progress', workerInProgress.raw);

    const workerComment = await request(`/api/issues/${issueOneId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(workerToken) },
      body: JSON.stringify({ text: 'Audit worker comment' })
    });
    check(workerComment.response.status === 201, 'Worker should be able to comment on assigned issue', workerComment.raw);

    const completionForm = new FormData();
    completionForm.append('workerId', String(worker.id));
    completionForm.append('completionNote', 'Audit completion note');
    completionForm.append('completionPhoto', makeImage('completion'), 'completion.png');

    const completionUpload = await request(`/api/issues/${issueOneId}/completion-photo`, {
      method: 'POST',
      headers: authHeaders(workerToken),
      body: completionForm
    });
    check(completionUpload.response.status === 200, 'Worker should upload completion photo', completionUpload.raw);
    if (completionUpload.body?.completionPhotoUrl) {
      created.uploads.push(completionUpload.body.completionPhotoUrl);
    }

    const managerRework = await request(`/api/manager/issues/${issueOneId}/rework`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders(managerToken) },
      body: JSON.stringify({ reason: 'Audit rework request' })
    });
    check(managerRework.response.status === 200, 'Manager should request rework from Under Review', managerRework.raw);

    const workerCompleteAfterRework = await request(`/api/issues/${issueOneId}/completed`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders(workerToken) },
      body: JSON.stringify({ workerId: worker.id })
    });
    check(workerCompleteAfterRework.response.status === 200, 'Worker should mark reworked issue completed', workerCompleteAfterRework.raw);

    const managerResolve = await request(`/api/manager/issues/${issueOneId}/resolve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders(managerToken) },
      body: JSON.stringify({})
    });
    check(managerResolve.response.status === 200, 'Manager should resolve completed issue', managerResolve.raw);

    const memberVerify = await request(`/api/issues/${issueOneId}/verify`, {
      method: 'POST',
      headers: authHeaders(activeMemberToken)
    });
    check(memberVerify.response.status === 200, 'Issue creator should verify resolved issue', memberVerify.raw);

    const memberStatusMutation = await request(`/api/issues/${issueTwoId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders(activeMemberToken) },
      body: JSON.stringify({ status: 'Resolved' })
    });
    check(memberStatusMutation.response.status === 403, 'Member should be blocked from generic issue status mutation', memberStatusMutation.raw);

    const managerReject = await request(`/api/manager/issues/${issueTwoId}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders(managerToken) },
      body: JSON.stringify({ reason: 'Audit rejection' })
    });
    check(managerReject.response.status === 200, 'Manager should reject pending issue', managerReject.raw);

    const workerDeleteOtherIssue = await request(`/api/issues/${issueThreeId}`, {
      method: 'DELETE',
      headers: authHeaders(workerToken)
    });
    check(workerDeleteOtherIssue.response.status === 403, 'Worker should not delete another user issue', workerDeleteOtherIssue.raw);

    const managerIssueList = await request('/api/manager/issues', {
      headers: authHeaders(managerToken)
    });
    progress('manager and worker flow');
    check(managerIssueList.response.status === 200, 'Manager issue list should return 200', managerIssueList.raw);

    const searchIssues = await request('/api/manager/issues/search?q=Audit', {
      headers: authHeaders(managerToken)
    });
    check(searchIssues.response.status === 200, 'Manager issue search should return 200', searchIssues.raw);

    const filterIssues = await request('/api/manager/issues/filter?priority=Urgent', {
      headers: authHeaders(managerToken)
    });
    check(filterIssues.response.status === 200, 'Manager issue filter should return 200', filterIssues.raw);

    const notifications = await request('/api/notifications', {
      headers: authHeaders(activeMemberToken)
    });
    check(notifications.response.status === 200, 'Member notifications should return 200', notifications.raw);

    const notificationId = notifications.body?.data?.[0]?.id;
    if (notificationId) {
      const markRead = await request(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: authHeaders(activeMemberToken)
      });
      check(markRead.response.status === 200, 'Member should mark single notification read', markRead.raw);
    }

    const markAllRead = await request('/api/notifications/read-all', {
      method: 'PUT',
      headers: authHeaders(activeMemberToken)
    });
    check(markAllRead.response.status === 200, 'Member should mark all notifications read', markAllRead.raw);

    const comments = await request(`/api/issues/${issueOneId}/comments`, {
      headers: authHeaders(activeMemberToken)
    });
    check(comments.response.status === 200, 'Issue comment history should return 200', comments.raw);

    const adminUsers = await request('/api/admin/users', {
      headers: authHeaders(adminToken)
    });
    check(adminUsers.response.status === 200, 'Admin user list should return 200', adminUsers.raw);

    const adminPromote = await request(`/api/admin/users/${adminTarget.id}/promote`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders(adminToken) },
      body: JSON.stringify({ role: 'Facility Manager' })
    });
    check(adminPromote.response.status === 200, 'Admin should change user role', adminPromote.raw);

    const adminDeactivate = await request(`/api/admin/users/${adminTarget.id}/deactivate`, {
      method: 'PUT',
      headers: authHeaders(adminToken)
    });
    check(adminDeactivate.response.status === 200, 'Admin should deactivate user', adminDeactivate.raw);

    const adminActivate = await request(`/api/admin/users/${adminTarget.id}/activate`, {
      method: 'PUT',
      headers: authHeaders(adminToken)
    });
    check(adminActivate.response.status === 200, 'Admin should activate user', adminActivate.raw);

    const adminReset = await request(`/api/admin/users/${adminTarget.id}/reset-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders(adminToken) },
      body: JSON.stringify({ newPassword: '999999' })
    });
    check(adminReset.response.status === 200, 'Admin should reset user password', adminReset.raw);

    const managerAnalytics = await request('/api/manager/analytics', {
      headers: authHeaders(managerToken)
    });
    check(managerAnalytics.response.status === 200, 'Manager analytics should return 200', managerAnalytics.raw);

    const adminAnalytics = await request('/api/admin/analytics', {
      headers: authHeaders(adminToken)
    });
    check(adminAnalytics.response.status === 200, 'Admin analytics should return 200', adminAnalytics.raw);

    const adminCategories = await request('/api/admin/categories', {
      headers: authHeaders(adminToken)
    });
    check(adminCategories.response.status === 200, 'Admin categories should return 200', adminCategories.raw);

    const createCategoryResult = await request('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(adminToken) },
      body: JSON.stringify({ name: 'Audit Category' })
    });
    check(createCategoryResult.response.status === 201, 'Admin should create category', createCategoryResult.raw);

    const updateCategoryResult = await request('/api/admin/categories/Audit%20Category', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders(adminToken) },
      body: JSON.stringify({ name: 'Audit Category Updated' })
    });
    check(updateCategoryResult.response.status === 200, 'Admin should update category', updateCategoryResult.raw);

    const deleteCategoryResult = await request('/api/admin/categories/Audit%20Category%20Updated', {
      method: 'DELETE',
      headers: authHeaders(adminToken)
    });
    check(deleteCategoryResult.response.status === 200, 'Admin should delete category', deleteCategoryResult.raw);

    const memberRecord = await prisma.user.findUnique({
      where: { id: memberId },
      select: { actsOfServicePoints: true }
    });
    check(
      (memberRecord?.actsOfServicePoints || 0) >= 30,
      'Issue submission should award Acts of Service points',
      JSON.stringify(memberRecord)
    );

    const workerRecord = await prisma.user.findUnique({
      where: { id: worker.id },
      select: { points: true }
    });
    check(
      (workerRecord?.points || 0) >= 15,
      'Worker workflow should award worker points',
      JSON.stringify(workerRecord)
    );

    const issueOneState = await prisma.issue.findUnique({
      where: { id: issueOneId },
      select: {
        status: true,
        assignedTo: true,
        verifiedBy: true,
        completionPhotoUrl: true
      }
    });
    check(issueOneState?.status === 'Resolved', 'Resolved issue should remain in Resolved state after verification', JSON.stringify(issueOneState));
    check(Boolean(issueOneState?.verifiedBy), 'Verified issue should store verifiedBy', JSON.stringify(issueOneState));

    const managerNotifications = await prisma.notification.count({
      where: { title: 'New ticket submitted' }
    });
    check(managerNotifications > 0, 'Issue creation should notify facility managers', String(managerNotifications));
    progress('admin flow and db assertions');
  } finally {
    progress('cleanup');
    const issueIds = created.issues.filter(Boolean);
    const userIds = created.users.filter(Boolean);

    if (issueIds.length > 0) {
      await prisma.notification.deleteMany({
        where: {
          OR: [
            { issueId: { in: issueIds } },
            { userId: { in: userIds } }
          ]
        }
      });
      await prisma.comment.deleteMany({
        where: { issueId: { in: issueIds } }
      });
      await prisma.issue.deleteMany({
        where: { id: { in: issueIds } }
      });
    } else if (userIds.length > 0) {
      await prisma.notification.deleteMany({
        where: { userId: { in: userIds } }
      });
    }

    if (userIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: userIds } }
      });
    }

    for (const relativePath of created.uploads) {
      if (!relativePath) {
        continue;
      }

      const absolutePath = path.join(__dirname, '..', relativePath.replace(/^\//, ''));
      await fs.rm(absolutePath, { force: true }).catch(() => {});
    }

    await prisma.$disconnect();

    await new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) {
          return;
        }

        settled = true;
        resolve();
      };

      server.close(() => finish());
      server.closeAllConnections?.();
      server.unref?.();
      setTimeout(finish, 250);
    });
  }

  if (failures.length > 0) {
    console.error(JSON.stringify({ ok: false, failures, notes }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({ ok: true, notes }, null, 2));
};

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
