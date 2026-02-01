/**
 * Database connection check - run with: node scripts/check-db.js
 * Uses Prisma to connect and verify User + Participant tables exist.
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check() {
  console.log("Checking database connection...\n");

  try {
    // 1. Raw connection test (Prisma $connect)
    await prisma.$connect();
    console.log("✓ Connected to MySQL successfully.");

    // 2. Check User table exists and count
    const userCount = await prisma.user.count();
    console.log(`✓ User table OK. Rows: ${userCount}`);

    // 3. Check Participant table exists and count
    const participantCount = await prisma.participant.count();
    console.log(`✓ Participant table OK. Rows: ${participantCount}`);

    // 4. If we have a user, show one (no password)
    const sampleUser = await prisma.user.findFirst({ select: { email: true, name: true } });
    if (sampleUser) {
      console.log(`  Sample user: ${sampleUser.email} (${sampleUser.name || "no name"})`);
    }

    console.log("\n✓ Database setup is working.");
  } catch (err) {
    console.error("\n✗ Database error:", err.message);
    if (err.code === "P1001") {
      console.log("\n→ MySQL might be stopped, or host/port wrong. Is MySQL running on localhost:3306?");
    }
    if (err.code === "P1003") {
      console.log("\n→ Database might not exist. Create it: CREATE DATABASE certificate_sender;");
    }
    if (err.code === "P1017") {
      console.log("\n→ Wrong username/password in DATABASE_URL (check .env).");
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

check();
