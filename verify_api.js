const http = require('http');

const post = (path, data, token) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
    });

    req.on('error', (e) => reject(e));
    req.write(JSON.stringify(data));
    req.end();
  });
};

const get = (path, token) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
    });

    req.on('error', (e) => reject(e));
    req.end();
  });
};

async function run() {
  try {
    console.log("1. Login Admin...");
    const adminLogin = await post('/api/auth/login', { email: 'dedek@kampus.com', password: '12345678' });
    console.log("Admin Login Status:", adminLogin.status);
    const adminToken = adminLogin.body.data.token;

    console.log("\n2. Create Group (Admin)...");
    const groupRes = await post('/api/admin/groups', { group_name: 'Test Group', batch_id: 'BATCH-001' }, adminToken);
    console.log("Create Group Status:", groupRes.status);
    console.log("Group ID:", groupRes.body.group?.id);

    console.log("\n3. List Groups (Admin)...");
    const listGroups = await get('/api/admin/groups', adminToken);
    console.log("List Groups Status:", listGroups.status);
    console.log("Groups Count:", listGroups.body.data.length);

    console.log("\n4. Login Student...");
    const studentLogin = await post('/api/auth/login', { email: 'damar@kampus.com', password: '12345678' });
    console.log("Student Login Status:", studentLogin.status);
    const studentToken = studentLogin.body.data.token;

    console.log("\n5. Get Profile (Student)...");
    const profile = await get('/api/user/profile', studentToken);
    console.log("Profile Status:", profile.status);
    console.log("Name:", profile.body.data.name);

    console.log("\n6. List Docs (Student)...");
    const docs = await get('/api/user/docs', studentToken);
    console.log("Docs Status:", docs.status);
    console.log("Docs Count:", docs.body.data.length);

  } catch (error) {
    console.error("Error:", error);
  }
}

run();
