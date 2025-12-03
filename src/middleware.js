const { readData } = require("./utils");

// Helper untuk mendapatkan user dari token (MOCK)
const getUserFromToken = (req) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return null;
  
  const token = authHeader.split(" ")[1];
  if (!token || !token.startsWith("mock-token-")) return null;

  // Format token: mock-token-{id}-{role}
  const parts = token.split("-");
  if (parts.length < 4) return null;

  const role = parts[parts.length - 1];
  const idParts = parts.slice(2, parts.length - 1);
  const id = idParts.join("-");

  // Verifikasi apakah user benar-benar ada di database
  const users = readData("user.json");
  const user = users.find(u => u.id === id);
  
  if (!user) return null;

  return user;
};

// Middleware untuk memastikan user login (Role apapun)
const requireAuth = (req, res, next) => {
  const user = getUserFromToken(req);
  if (!user) {
    return res.status(401).json({
      message: "Tidak terautentikasi. Token tidak valid atau kadaluarsa.",
      error: { code: "UNAUTHORIZED" },
      meta: { timestamp: new Date().toISOString() },
    });
  }
  req.user = user;
  next();
};

// Middleware cek admin
const requireAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Akses ditolak. Hanya admin yang diizinkan.",
        error: { code: "FORBIDDEN" },
        meta: { timestamp: new Date().toISOString() },
      });
    }
    next();
  });
};

module.exports = {
  requireAuth,
  requireAdmin
};
