// Reset all FAILED participants back to PENDING so they can be retried
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function resetFailed() {
    try {
        const result = await prisma.participant.updateMany({
            where: { status: "FAILED" },
            data: { status: "PENDING" },
        });
        console.log(`Reset ${result.count} FAILED participants back to PENDING`);

        const pending = await prisma.participant.findMany({
            where: { status: "PENDING" },
        });
        console.log(`Total PENDING participants now: ${pending.length}`);
        pending.forEach(p => console.log(`  - ${p.name} (${p.email})`));
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

resetFailed();
