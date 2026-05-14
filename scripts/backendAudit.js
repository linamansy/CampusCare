require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000/api';

async function setupTestUsers() {
  console.log('🛠️ Setting up test users...');
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const managerEmail = 'audit-manager@campuscare.test';
  const workerEmail = 'audit-worker@campuscare.test';

  const manager = await prisma.user.upsert({
    where: { email: managerEmail },
    update: { role: 'Facility Manager', password: hashedPassword, isActive: true, isVerified: true },
    create: {
      name: 'Audit Manager',
      email: managerEmail,
      password: hashedPassword,
      role: 'Facility Manager',
      isActive: true,
      isVerified: true
    }
  });

  const worker = await prisma.user.upsert({
    where: { email: workerEmail },
    update: { role: 'Worker', password: hashedPassword, isActive: true, isVerified: true },
    create: {
      name: 'Audit Worker',
      email: workerEmail,
      password: hashedPassword,
      role: 'Worker',
      isActive: true,
      isVerified: true
    }
  });

  console.log(`✅ Test users ready: Manager (${manager.id}), Worker (${worker.id})`);
  return { manager, worker };
}

async function runAudit() {
  console.log('🚀 Starting CampusCare Backend Audit...');

  try {
    const { manager, worker } = await setupTestUsers();
    
    // 1. Auth Flow Test
    console.log('\n--- 🔐 Authentication ---');
    const timestamp = Date.now();
    const testEmail = `test-user-${timestamp}@campuscare.test`;
    const testPassword = 'password123';

    console.log(`Registering ${testEmail}...`);
    const regRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Test User',
      email: testEmail,
      password: testPassword,
      role: 'Community Member'
    });
    console.log('✅ Registration successful');

    console.log('Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: testEmail,
      password: testPassword
    });
    const userToken = loginRes.data.accessToken;
    const userId = loginRes.data.user.id;
    console.log('✅ Login successful, Token received');

    // 2. Issue Submission Flow
    console.log('\n--- 📝 Issue Submission ---');
    const form = new FormData();
    form.append('title', 'Leaking Pipe in Audit Test');
    form.append('description', 'Water is leaking from the ceiling');
    form.append('category', 'Plumbing');
    form.append('building', 'Engineering');
    form.append('floor', '1');
    form.append('room', '101');
    form.append('location', 'Engineering - Floor 1 - Room 101');
    
    // Create a dummy image for testing
    const dummyImagePath = path.join(__dirname, 'dummy.png');
    fs.writeFileSync(dummyImagePath, 'dummy content');
    form.append('image', fs.createReadStream(dummyImagePath));

    const submitRes = await axios.post(`${API_URL}/issues`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${userToken}`
      }
    });
    const issueId = submitRes.data.data.id;
    console.log(`✅ Issue #${issueId} submitted successfully`);

    // 3. Manager Workflow
    console.log('\n--- 👔 Manager Workflow ---');
    const managerEmail = 'audit-manager@campuscare.test';
    const managerPassword = 'password123';

    console.log('Manager logging in...');
    const mLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: managerEmail,
      password: managerPassword
    });
    const mToken = mLoginRes.data.accessToken;
    console.log('✅ Manager login successful');

    console.log(`Assigning Issue #${issueId} to Worker (ID: ${worker.id})...`);
    const assignRes = await axios.put(`${API_URL}/manager/issues/${issueId}/assign`, {
      workerId: worker.id
    }, {
      headers: { Authorization: `Bearer ${mToken}` }
    });
    console.log('✅ Issue assigned to worker');

    // 4. Worker Workflow
    console.log('\n--- 🛠️ Worker Workflow ---');
    const workerEmail = 'audit-worker@campuscare.test';
    const workerPassword = 'password123';

    console.log('Worker logging in...');
    const wLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: workerEmail,
      password: workerPassword
    });
    const wToken = wLoginRes.data.accessToken;
    console.log('✅ Worker login successful');

    console.log(`Updating Issue #${issueId} to In Progress...`);
    // Workers use PUT /issues/:id/in-progress
    await axios.put(`${API_URL}/issues/${issueId}/in-progress`, {}, {
        headers: { Authorization: `Bearer ${wToken}` }
    });
    console.log('✅ Status updated to In Progress');

    console.log(`Updating Issue #${issueId} to Completed...`);
    // Workers use PUT /issues/:id/completed
    await axios.put(`${API_URL}/issues/${issueId}/completed`, {}, {
        headers: { Authorization: `Bearer ${wToken}` }
    });
    console.log('✅ Status updated to Completed');

    // 5. Verification Flow
    console.log('\n--- 🏁 Verification ---');
    console.log('Manager resolving issue...');
    await axios.put(`${API_URL}/manager/issues/${issueId}/resolve`, {}, {
      headers: { Authorization: `Bearer ${mToken}` }
    });
    console.log('✅ Issue resolved');

    console.log('User verifying resolution...');
    const verifyRes = await axios.post(`${API_URL}/issues/${issueId}/verify`, {}, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('✅ Resolution verified');

    console.log('\n✨ Backend Audit Passed!');
    
    // Cleanup
    if (fs.existsSync(dummyImagePath)) fs.unlinkSync(dummyImagePath);
  } catch (error) {
    console.error('\n❌ Audit Failed:');
    if (error.response) {
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Status:', error.response.status);
      console.error('Config URL:', error.config.url);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAudit();
