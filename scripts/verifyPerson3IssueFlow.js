const app = require('../src/app');
const prisma = require('../src/prismaClient');

const PORT = Number(process.env.VERIFY_PERSON3_PORT || 3200);
const BASE_URL = `http://127.0.0.1:${PORT}`;

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
  const issueIds = [];

  try {
    await request('/');

    user = await prisma.user.create({
      data: {
        name: 'Person 3 Verification User',
        email: `person3-${Date.now()}@campuscare.test`,
        password: 'not-used',
        role: 'community member'
      }
    });

    const createIssue = async (payload) => {
      const response = await request('/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(user.id)
        },
        body: JSON.stringify(payload)
      });

      issueIds.push(response.data.id);
      return response.data;
    };

    const issueOne = await createIssue({
      title: '<b>Broken</b> sink',
      description: 'Sink <script>alert("x")</script> is leaking',
      category: 'Plumbing',
      location: 'Building A  ' // extra spaces for normalization
    });

    assert(issueOne.status === 'Submitted/Pending', 'New issue should start in Submitted/Pending');
    assert(issueOne.priority === 'Normal', 'First issue at a location should be Normal priority');
    assert(!issueOne.title.includes('<'), 'Title should be sanitized');
    assert(!issueOne.description.includes('<'), 'Description should be sanitized');
    assert(!issueOne.location.includes('  '), 'Location should be normalized');

    const issueTwo = await createIssue({
      title: 'Another sink issue',
      description: 'Same location problem',
      category: 'Plumbing',
      location: 'building a'
    });

    assert(issueTwo.priority === 'High', 'Duplicate location should escalate to High priority');

    const invalidStatusResponse = await fetch(`${BASE_URL}/issues/${issueTwo.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Anything' })
    });

    assert(invalidStatusResponse.status === 400, 'Invalid status should be rejected');

    const inProgress = await request(`/issues/${issueTwo.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'In Progress' })
    });

    assert(inProgress.status === 'In Progress', 'Valid status transition should succeed');

    console.log('Person 3 issue flow verification passed');
  } finally {
    if (issueIds.length > 0) {
      await prisma.comment.deleteMany({ where: { issueId: { in: issueIds } } });
      await prisma.issue.deleteMany({ where: { id: { in: issueIds } } });
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
