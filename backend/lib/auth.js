const jwt = require("jsonwebtoken");
const { prisma } = require("./prisma");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch {
    return null;
  }
}

async function getUserFromToken(token) {
  if (!token) return null;
  const userId = verifyToken(token);
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

module.exports = { signToken, verifyToken, getUserFromToken };
