// server.js

const express = require("express");
const authRouter = require("./src/auth"); // Import router langsung dari auth.js

const cors = require("cors"); // Import cors

const app = express();
const port = 3000;

// --- Middleware Global ---

// 1. Mengaktifkan CORS
app.use(cors());

// 2. Middleware untuk parsing body JSON
app.use(express.json());

// --- Routes Utama ---
// Pasang authRouter pada path /api/auth
app.use("/api/auth", authRouter);
app.use("/api/admin", require("./src/admin"));
app.use("/api/user", require("./src/user"));
app.use("/api/group", require("./src/group"));

// --- Menjalankan Server ---
app.listen(port, () => {
  console.log(`✨ Mock API server berjalan di http://localhost:${port}`);
});
