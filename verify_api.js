const http = require("http");

const post = (path, data, token) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () =>
        resolve({ status: res.statusCode, body: JSON.parse(body) })
      );
    });

    req.on("error", (e) => reject(e));
    req.write(JSON.stringify(data));
    req.end();
  });
};

const get = (path, token) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: path,
      method: "GET",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () =>
        resolve({ status: res.statusCode, body: JSON.parse(body) })
      );
    });

    req.on("error", (e) => reject(e));
    req.end();
  });
};

async function run() {
  try {
    console.log("1. Login Admin...");
    const adminLogin = await post("/api/auth/login", {
      email: "dedek@kampus.com",
      password: "12345678",
    });
    console.log("Admin Login Status:", adminLogin.status);
    const adminToken = adminLogin.body.data.token;

    console.log("\n2. Set Group Rules (Admin)...");
    const rulesData = {
      batch_id: "BATCH-001",
      rules: [
        {
          user_attribute: "learning_path",
          attribute_value: "Machine Learning",
          operator: ">=",
          value: "2",
        },
      ],
    };
    const setRules = await post("/api/admin/rules", rulesData, adminToken);
    console.log("Set Rules Status:", setRules.status);

    console.log("\n3. Login Student (Machine Learning)...");
    const studentLogin = await post("/api/auth/login", {
      email: "damar@kampus.com",
      password: "12345678",
    });
    const studentToken = studentLogin.body.data.token;
    const studentId1 = "f51ddb99-9c0b-4ef8-bb6d-6bb9bd380a16"; // Damar (ML)
    const studentId2 = "g62eee99-9c0b-4ef8-bb6d-6bb9bd380a17"; // Tugus (ML)

    console.log("\n4. Get Rules (Student)...");
    const getRules = await get("/api/group/rules", studentToken);
    console.log("Get Rules Status:", getRules.status);
    console.log("Active Rules:", getRules.body.data.length);

    console.log("\n5. Register Team (Success Case)...");
    // Register team with 2 ML students (should pass)
    const teamData = {
      group_name: "Team AI Super",
      member_ids: [studentId1, studentId2],
    };
    const registerTeam = await post(
      "/api/group/register",
      teamData,
      studentToken
    );
    console.log("Register Team Status:", registerTeam.status);
    const groupId = registerTeam.body.data?.group_id;
    console.log("New Group ID:", groupId);

    if (groupId) {
      console.log("\n6. Validate Team (Admin)...");
      const validate = await post(
        `/api/admin/groups/${groupId}/validate`,
        { status: "accepted" },
        adminToken
      );
      console.log("Validate Team Status:", validate.status);
      console.log("New Status:", validate.body.data.status);
    }

    console.log("\n7. Register Team (Fail Case - Double Submission)...");
    // Try to register same members again
    const failRegister = await post(
      "/api/group/register",
      teamData,
      studentToken
    );
    console.log("Fail Register Status:", failRegister.status); // Should be 400
    console.log("Error Code:", failRegister.body.error?.code);
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
