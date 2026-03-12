const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        await prisma.$connect();
        console.log('Successfully connected to the database!');
        const users = await prisma.user.findMany();
        console.log('Found users:', users.length);
        const participants = await prisma.participant.findMany();
        console.log('Found participants:', participants.length);
    } catch (e) {
        console.error('Failed to connect to the database:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
