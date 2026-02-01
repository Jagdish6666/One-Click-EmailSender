const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const email = "admin@example.com";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin already exists:", email);
    return;
  }
  const password = await bcrypt.hash("admin123", 10);
  await prisma.user.create({
    data: { email, password, name: "Admin" },
  });
  console.log("Seed done. Admin: admin@example.com / admin123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
