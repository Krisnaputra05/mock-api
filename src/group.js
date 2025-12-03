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

module.exports = router;
