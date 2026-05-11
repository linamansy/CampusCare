const urls = [
  { label: 'HEALTH', url: 'http://localhost:3000/health' },
  { label: 'USERS_NO_AUTH', url: 'http://localhost:3000/api/users' },
  { label: 'MANAGER_ISSUES_WITH_ID1', url: 'http://localhost:3000/api/manager/issues', headers: { 'x-user-id': '1' } },
  { label: 'ADMIN_USERS_WITH_ID1', url: 'http://localhost:3000/api/admin/users', headers: { 'x-user-id': '1' } }
];

(async () => {
  for (const { label, url, headers } of urls) {
    try {
      const res = await fetch(url, { headers });
      const text = await res.text();
      console.log('---', label, '---');
      console.log('status:', res.status);
      console.log(text);
    } catch (err) {
      console.error('---', label, 'ERROR ---');
      console.error(err);
    }
  }
})();
