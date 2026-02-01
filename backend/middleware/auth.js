const { getUserFromToken } = require("../lib/auth");

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const user = await getUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  req.user = user;
  next();
}

module.exports = { requireAuth };
