const app = require('../src/app');
const prisma = require('../src/prismaClient');
const jwt = require('jsonwebtoken');

const PORT = Number(process.env.VERIFY_PERSON3_PORT || 3200);
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

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const main = async () => {
  const server = await new Promise((resolve) => {
    const instance = app.listen(PORT, () => resolve(instance));
  });

  let user;
  let accessToken;
  const issueIds = [];

  try {
    await request('/');

    user = await prisma.user.create({
      data: {
        name: 'Person 3 Verification User',
        email: `person3-${Date.now()}@campuscare.test`,
        password: 'not-used',
        role: 'Community Member',
        isVerified: true,
        isActive: true
      }
    });

    accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        jti: `verify-${Date.now()}`
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const createIssue = async (payload) => {
      const formData = new FormData();

      for (const [key, value] of Object.entries(payload)) {
        formData.append(key, String(value));
      }

      formData.append('image', new Blob(['verification-image'], { type: 'image/png' }), 'issue.png');

      const response = await request('/issues', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: formData
      });

      issueIds.push(response.data.id);
      return response.data;
    };

    const room = String(Date.now());
    const locationBase = `Building A Floor 2 Room ${room}`;

    const issueOne = await createIssue({
      title: '<b>Broken</b> sink',
      description: 'Sink <script>alert("x")</script> is leaking',
      category: 'Plumbing',
      building: 'Building A',
      floor: '2',
      room,
      location: `${locationBase}  `
    });

    assert(issueOne.status === 'Submitted/Pending', 'New issue should start in Submitted/Pending');
    assert(issueOne.priority === 'Normal', 'First issue at a location should be Normal priority');
    assert(!issueOne.title.includes('<'), 'Title should be sanitized');
    assert(!issueOne.description.includes('<'), 'Description should be sanitized');
    assert(!issueOne.location.includes('  '), 'Location should be normalized');
    assert(issueOne.image, 'Issue photo should be saved');

    await createIssue({
      title: 'Another sink issue',
      description: 'Same location problem',
      category: 'Plumbing',
      building: 'building a',
      floor: '2',
      room,
      location: locationBase.toLowerCase()
    });

    const issueThree = await createIssue({
      title: 'Third sink issue',
      description: 'Same room recurring problem',
      category: 'Plumbing',
      building: 'Building A',
      floor: '2',
      room,
      location: locationBase.toUpperCase()
    });

    assert(issueThree.priority === 'High', 'Third duplicate room report should escalate to High priority');

    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
    assert(updatedUser.actsOfServicePoints >= 30, 'Issue submission should award Acts of Service points');

    const notificationCount = await prisma.notification.count({ where: { userId: user.id } });
    assert(notificationCount >= 3, 'Issue submission should create user notifications');

    const invalidStatusResponse = await fetch(`${BASE_URL}/issues/${issueThree.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Anything' })
    });

    assert(invalidStatusResponse.status >= 400, 'Invalid status should be rejected');

    const inProgress = await request(`/issues/${issueThree.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'In Progress' })
    });

    assert(inProgress.status === 'In Progress', 'Valid status transition should succeed');

    console.log('Person 3 issue flow verification passed');
  } finally {
    if (issueIds.length > 0) {
      await prisma.notification.deleteMany({ where: { issueId: { in: issueIds } } });
      await prisma.comment.deleteMany({ where: { issueId: { in: issueIds } } });
      await prisma.issue.deleteMany({ where: { id: { in: issueIds } } });
    }

    if (user) {
      await prisma.notification.deleteMany({ where: { userId: user.id } });
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
