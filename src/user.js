const express = require("express");
const router = express.Router();
const { readData } = require("./utils");
const { requireAuth } = require("./middleware");

// a. Get Profile
router.get("/profile", requireAuth, (req, res) => {
  // req.user sudah di-set oleh middleware requireAuth
  // Kita kembalikan data user, tapi tanpa password
  const { password, ...userData } = req.user;
  
  // Tambahkan field dummy jika belum ada di user.json
  const responseData = {
    name: userData.full_name,
    email: userData.email,
    role: userData.role,
    university: userData.university || "Universitas Mocking",
    learning_group: userData.learning_group || "Batch 1"
  };

  res.status(200).json({
    message: "Berhasil mengambil profil pengguna.",
    data: responseData,
    meta: { timestamp: new Date().toISOString() },
  });
});

// b. List Available Docs
router.get("/docs", requireAuth, (req, res) => {
  const docs = readData("docs.json");
  
  res.status(200).json({
    message: "Berhasil mengambil daftar dokumen.",
    data: docs,
    meta: { timestamp: new Date().toISOString() },
  });
});

// c. List Project Timeline
router.get("/timeline", requireAuth, (req, res) => {
  const timeline = readData("timeline.json");
  
  res.status(200).json({
    message: "Berhasil mengambil timeline proyek.",
    data: timeline,
    meta: { timestamp: new Date().toISOString() },
  });
});

// d. List Use Cases
router.get("/use-cases", requireAuth, (req, res) => {
  const useCases = readData("use_cases.json");
  
  res.status(200).json({
    message: "Berhasil mengambil daftar use cases.",
    data: useCases,
    meta: { timestamp: new Date().toISOString() },
  });
});

module.exports = router;
