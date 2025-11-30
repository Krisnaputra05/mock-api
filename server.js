// server.js

const express = require("express");
const authRouter = require("./src/auth"); // Import router langsung dari auth.js

const app = express();
const port = 3000;

// --- Middleware Global ---

// 1. Mengaktifkan CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// 2. Middleware untuk parsing body JSON
app.use(express.json());

// --- Routes Utama ---
// Pasang authRouter pada path /api/auth
app.use("/api/auth", authRouter);

// --- Menjalankan Server ---
app.listen(port, () => {
  console.log(`✨ Mock API server berjalan di http://localhost:${port}`);
});
