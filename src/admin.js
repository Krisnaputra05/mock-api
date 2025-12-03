const express = require("express");
const router = express.Router();
const { readData, writeData } = require("./utils");
const { requireAdmin } = require("./middleware");

// a. Create Group
router.post("/groups", requireAdmin, (req, res) => {
  const { group_name, batch_id } = req.body;

  // Validasi
  const errorFields = {};
  if (!group_name) errorFields.group_name = "Nama grup wajib diisi.";
  if (!batch_id) errorFields.batch_id = "Batch ID wajib diisi.";

  if (Object.keys(errorFields).length > 0) {
    return res.status(400).json({
      message: "Permintaan tidak valid. Beberapa field wajib diisi.",
      error: {
        code: "VALIDATION_FAILED",
        fields: errorFields,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  }

  const groups = readData("groups.json");
  
  // Generate ID baru (Mock UUID)
  const newId = `group-${Date.now()}`;
  
  const newGroup = {
    id: newId,
    group_name,
    batch_id,
    creator_user_ref: req.user.id,
    status: "draft",
    created_at: new Date().toISOString(),
  };

  groups.push(newGroup);

  if (writeData("groups.json", groups)) {
    res.status(201).json({
      message: "Grup berhasil dibuat dan leader telah ditetapkan.",
      group: newGroup,
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

// b. Update Group
router.put("/groups/:groupId", requireAdmin, (req, res) => {
  const { groupId } = req.params;
  const { group_name, batch_id, status } = req.body;

  const groups = readData("groups.json");
  const groupIndex = groups.findIndex((g) => g.id === groupId);

  if (groupIndex === -1) {
    return res.status(404).json({
      message: "Grup tidak ditemukan.",
      error: { code: "NOT_FOUND" },
      meta: { timestamp: new Date().toISOString() },
    });
  }

  // Update fields
  if (group_name) groups[groupIndex].group_name = group_name;
  if (batch_id) groups[groupIndex].batch_id = batch_id;
  if (status) groups[groupIndex].status = status;
  
  groups[groupIndex].updated_at = new Date().toISOString();

  if (writeData("groups.json", groups)) {
    res.status(200).json({
      message: `Grup ID ${groupId} berhasil diperbarui.`,
      group: {
        id: groupId,
        group_name: groups[groupIndex].group_name,
        batch_id: groups[groupIndex].batch_id,
        updated_at: groups[groupIndex].updated_at,
      },
      meta: { timestamp: new Date().toISOString() },
    });
  } else {
    res.status(500).json({
      message: "Gagal memperbarui grup.",
      error: { code: "INTERNAL_SERVER_ERROR" },
      meta: { timestamp: new Date().toISOString() },
    });
  }
});

// c. Update Project Status
router.put("/project/:groupId", requireAdmin, (req, res) => {
  const { groupId } = req.params;

  const groups = readData("groups.json");
  const groupIndex = groups.findIndex((g) => g.id === groupId);

  if (groupIndex === -1) {
    return res.status(404).json({
      message: "Grup tidak ditemukan.",
      error: { code: "NOT_FOUND" },
      meta: { timestamp: new Date().toISOString() },
    });
  }

  groups[groupIndex].status = "in_progress";
  groups[groupIndex].updated_at = new Date().toISOString();

  if (writeData("groups.json", groups)) {
    res.status(200).json({
      message: `Status proyek untuk Grup ID ${groupId} berhasil diubah menjadi 'in_progress'.`,
      meta: { timestamp: new Date().toISOString() },
    });
  } else {
    res.status(500).json({
      message: "Gagal memperbarui status proyek.",
      error: { code: "INTERNAL_SERVER_ERROR" },
      meta: { timestamp: new Date().toISOString() },
    });
  }
});

// d. List All Groups
router.get("/groups", requireAdmin, (req, res) => {
  const groups = readData("groups.json");
  const users = readData("user.json"); // Perlu baca user untuk dapat nama creator

  const groupsWithCreator = groups.map((group) => {
    const creator = users.find((u) => u.id === group.creator_user_ref);
    return {
      id: group.id,
      group_name: group.group_name,
      batch_id: group.batch_id,
      status: group.status,
      creator_name: creator ? creator.full_name : "Unknown",
      created_at: group.created_at,
    };
  });

  res.status(200).json({
    message: "Berhasil mengambil semua grup.",
    data: groupsWithCreator,
    meta: { timestamp: new Date().toISOString() },
  });
});

module.exports = router;
