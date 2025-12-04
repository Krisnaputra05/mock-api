const express = require("express");
const router = express.Router();
const { readData, writeData } = require("./utils");
const { requireAuth } = require("./middleware");

// a. Upload Document
router.post("/docs", requireAuth, (req, res) => {
  const { group_id, url } = req.body;

  // Validasi
  if (!group_id || !url) {
    return res.status(400).json({
      message: "group_id dan url wajib diisi.",
      error: { code: "VALIDATION_FAILED" },
      meta: { timestamp: new Date().toISOString() },
    });
  }

  // Cek apakah group ada (opsional, tapi baik untuk validasi)
  const groups = readData("groups.json");
  const groupExists = groups.some(g => g.id === group_id);
  
  // Jika kita ingin strict, uncomment baris di bawah. 
  // Namun spec hanya bilang 400 jika field kosong.
  // if (!groupExists) { ... return 404 ... }

  // Kita simpan dokumen ini di mana? 
  // Spec tidak bilang simpan di `docs.json` (itu referensi).
  // Mungkin simpan di `group_docs.json` atau update `groups.json`?
  // Spec bilang "Success Response... doc_id".
  // Saya akan buat `group_docs.json` untuk menyimpan dokumen yang diupload user.
  
  const groupDocs = readData("group_docs.json"); // File baru, akan dibuat otomatis empty array oleh utils jika tidak ada
  
  const newDocId = `doc-upload-${Date.now()}`;
  const newDoc = {
    id: newDocId,
    group_id,
    url,
    uploaded_by: req.user.id,
    uploaded_at: new Date().toISOString()
  };

  groupDocs.push(newDoc);

  if (writeData("group_docs.json", groupDocs)) {
    res.status(201).json({
      message: "Dokumen berhasil dibuat.",
      doc_id: newDocId,
      meta: { timestamp: new Date().toISOString() },
    });
  } else {
    res.status(500).json({
      message: "Gagal menyimpan dokumen.",
      error: { code: "INTERNAL_SERVER_ERROR" },
      meta: { timestamp: new Date().toISOString() },
    });
  }
});

// b. Get Group Rules
router.get("/rules", requireAuth, (req, res) => {
  const rules = readData("rules.json");
  const activeRules = rules.filter(r => r.is_active !== false); // Default active if not specified

  res.status(200).json({
    message: "Berhasil mengambil aturan grup.",
    data: activeRules,
    meta: { timestamp: new Date().toISOString() },
  });
});

// c. Register Team
router.post("/register", requireAuth, (req, res) => {
  const { group_name, member_ids } = req.body;

  // 1. Validasi Input Dasar
  if (!group_name || !member_ids || !Array.isArray(member_ids) || member_ids.length === 0) {
    return res.status(400).json({
      message: "Nama grup dan daftar anggota wajib diisi.",
      error: { code: "VALIDATION_FAILED" },
      meta: { timestamp: new Date().toISOString() },
    });
  }

  // 2. Cek Double Submission (Member sudah ada di grup lain yang valid/pending?)
  const groups = readData("groups.json");
  const allUsers = readData("user.json");
  
  // Asumsi: grup valid adalah yang statusnya != 'rejected' (bisa 'draft', 'pending_validation', 'accepted')
  // Atau mungkin hanya 'accepted' dan 'pending_validation'? Mari kita asumsikan pending & accepted.
  // Tapi di mock awal status default 'draft'.
  // Mari kita cek apakah user ID ada di grup mana pun yang tidak rejected.
  
  // Namun, struktur `groups.json` awal kita belum punya `members`.
  // Kita perlu update struktur `groups.json` saat register ini untuk menyimpan `members`.
  // Struktur awal: { id, group_name, batch_id, creator_user_ref, status }
  // Kita akan tambahkan `members` array of user IDs.

  const doubleUserIds = [];
  
  // Flatten semua member dari semua grup yang aktif
  const activeGroups = groups.filter(g => g.status !== "rejected");
  
  member_ids.forEach(memberId => {
    const isTaken = activeGroups.some(g => g.members && g.members.includes(memberId));
    if (isTaken) {
      doubleUserIds.push(memberId);
    }
  });

  if (doubleUserIds.length > 0) {
    return res.status(400).json({
      message: "Beberapa anggota sudah terdaftar di tim lain yang valid.",
      error: {
        code: "DOUBLE_SUBMISSION",
        fields: { doubleUserIds }
      },
      meta: { timestamp: new Date().toISOString() },
    });
  }

  // 3. Validasi Komposisi Tim berdasarkan Rules
  const rules = readData("rules.json");
  const activeRules = rules.filter(r => r.is_active !== false);

  // Ambil data lengkap member
  const teamMembers = allUsers.filter(u => member_ids.includes(u.id));
  
  // Cek apakah semua member ID valid
  if (teamMembers.length !== member_ids.length) {
     return res.status(400).json({
      message: "Beberapa ID anggota tidak ditemukan.",
      error: { code: "INVALID_MEMBER_ID" },
      meta: { timestamp: new Date().toISOString() },
    });
  }

  // Evaluasi Rules
  for (const rule of activeRules) {
    // Contoh rule: { user_attribute: "learning_path", attribute_value: "Machine Learning", operator: ">=", value: "2" }
    
    // Hitung berapa member yang memenuhi kriteria atribut ini
    const count = teamMembers.filter(m => m[rule.user_attribute] === rule.attribute_value).length;
    const requiredValue = parseInt(rule.value, 10);
    
    let isValid = false;
    if (rule.operator === ">=") isValid = count >= requiredValue;
    else if (rule.operator === "<=") isValid = count <= requiredValue;
    else if (rule.operator === "==") isValid = count === requiredValue;
    
    if (!isValid) {
      return res.status(400).json({
        message: `Komposisi tim tidak memenuhi syarat: ${rule.attribute_value} harus ${rule.operator} ${rule.value}.`,
        error: { code: "INVALID_COMPOSITION" },
        meta: { timestamp: new Date().toISOString() },
      });
    }
  }

  // 4. Simpan Grup Baru
  const newGroupId = `group-${Date.now()}`;
  const newGroup = {
    id: newGroupId,
    group_name,
    members: member_ids, // Simpan daftar anggota
    creator_user_ref: req.user.id, // Ketua adalah yang mendaftarkan (asumsi)
    status: "pending_validation",
    created_at: new Date().toISOString()
  };

  groups.push(newGroup);

  if (writeData("groups.json", groups)) {
    res.status(201).json({
      message: "Pendaftaran tim berhasil dikirim dan menunggu validasi.",
      data: {
        group_id: newGroupId,
        status: "pending_validation"
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } else {
    res.status(500).json({
      message: "Gagal menyimpan grup.",
      error: { code: "INTERNAL_SERVER_ERROR" },
      meta: { timestamp: new Date().toISOString() },
    });
  }
});

module.exports = router;
