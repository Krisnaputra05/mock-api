// src/auth.js

const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router(); // Inisiasi Router Express

// Path ke file data user.json
const dataPath = path.join(__dirname, "..", "data", "user.json");

// --- UTILITIES UNTUK MENGELOLA JSON FILE ---

const readData = () => {
  try {
    const rawData = fs.readFileSync(dataPath, "utf8");
    return JSON.parse(rawData);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.warn(
        "File user.json tidak ditemukan, mengembalikan array kosong."
      );
      return [];
    }
    console.error("Gagal membaca data JSON:", error);
    return [];
  }
};

const writeData = (data) => {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    fs.writeFileSync(dataPath, jsonString, "utf8");
    return true;
  } catch (error) {
    console.error("Gagal menulis data JSON:", error);
    return false;
  }
};

// --- FUNGSI CONTROLLER (didefinisikan di sini) ---

// Login pengguna (MOCK)
async function login(req, res) {
  const { email, password } = req.body || {};

  // [Logika Validasi Input]
  const errorFields = {};
  if (!email) errorFields.email = "Email wajib diisi.";
  if (!password) errorFields.password = "Password wajib diisi.";
  if (Object.keys(errorFields).length > 0) {
    return res.status(400).json({
      message: "Permintaan tidak valid.",
      error: { code: "VALIDATION_FAILED", fields: errorFields },
      meta: { timestamp: new Date().toISOString() },
    });
  }

  const users = readData();
  const user = users.find((u) => u.email === email && u.password === password);

  // User Tidak Ditemukan
  if (!user) {
    return res.status(401).json({
      message: "Kredensial tidak valid.",
      error: { code: "INVALID_CREDENTIALS" },
      meta: { timestamp: new Date().toISOString() },
    });
  }

  // Sukses
  const mockToken = `mock-token-${user.id}-${user.role}`;
  const { password: userPassword, ...userData } = user;

  return res.status(200).json({
    message: "Login berhasil.",
    data: { token: mockToken, user: userData },
    meta: { timestamp: new Date().toISOString() },
  });
}

// Registrasi pengguna baru (MOCK)
async function register(req, res) {
  const { email, password, full_name, role } = req.body || {};

  // [Logika Validasi Input]
  const errorFields = {};
  if (!email) errorFields.email = "Email wajib diisi.";
  if (!password) errorFields.password = "Password wajib diisi.";
  if (!full_name) errorFields.full_name = "Nama lengkap wajib diisi.";
  if (Object.keys(errorFields).length > 0) {
    return res.status(400).json({
      message: "Data pendaftaran tidak lengkap.",
      error: { code: "VALIDATION_FAILED", fields: errorFields },
      meta: { timestamp: new Date().toISOString() },
    });
  }

  // [Logika Validasi Role]
  const normalizedRole = (role || "student").toLowerCase();
  if (!["student", "admin"].includes(normalizedRole)) {
    return res.status(400).json({
      message: "Role tidak valid.",
      error: {
        code: "INVALID_ROLE",
        fields: { role: "Role harus 'student' atau 'admin'." },
      },
      meta: { timestamp: new Date().toISOString() },
    });
  }

  // Cek Email Sudah Ada
  const currentData = readData();
  const existing = currentData.find((u) => u.email === email);
  if (existing) {
    return res.status(409).json({
      message: "Email sudah terdaftar.",
      error: { code: "EMAIL_ALREADY_EXISTS" },
      meta: { timestamp: new Date().toISOString() },
    });
  }

  // Proses Pendaftaran
  // Catatan: Menggunakan UUID dummy dari input register untuk mock ID baru (karena ID asli di JSON adalah UUID string)
  // Untuk mock yang lebih baik, kita akan gunakan string UUID acak, tapi untuk menjaga konsistensi dengan contoh sebelumnya,
  // kita gunakan logika ID sederhana.
  const newId = `uuid-mock-${currentData.length + 1}`;
  const newUser = {
    id: newId,
    email,
    password,
    full_name,
    role: normalizedRole,
    created_at: new Date().toISOString(),
  };

  currentData.push(newUser);

  if (!writeData(currentData)) {
    return res.status(500).json({
      message: "Gagal mendaftarkan pengguna karena kesalahan file I/O.",
      error: { code: "FILE_WRITE_FAILED" },
      meta: { timestamp: new Date().toISOString() },
    });
  }

  const { password: userPassword, ...userData } = newUser;

  // Sukses
  return res.status(201).json({
    message: "Pendaftaran berhasil. Silakan login.",
    data: { user: userData },
    meta: { timestamp: new Date().toISOString() },
  });
}

// Logout pengguna (MOCK) <-- FUNGSI BARU
async function logout(req, res) {
  // Di sisi server, kita hanya mengonfirmasi bahwa permintaan telah diterima.
  // Tugas klien: segera menghapus token JWT yang dimilikinya.

  // Menggunakan format respons yang konsisten:
  return res.status(200).json({
    message:
      "Logout berhasil. Token Anda tidak lagi valid dan telah dihapus dari sisi klien.",
    data: {}, // Mengembalikan data kosong atau null
    meta: { timestamp: new Date().toISOString() },
  });
}

// --- DEFINISI ENDPOINT PADA ROUTER ---

router.post("/login", login);
router.post("/register", register);
router.post("/logout", logout); // <-- TAMBAHKAN ENDPOINT LOGOUT DI SINI!

// Ekspor router Express
module.exports = router;
