const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const setting = await prisma.systemSetting.findUnique({ where: { id: 'default' } });
  console.log('Creds:', setting?.data);
  const conv = await prisma.conversation.findFirst({ orderBy: { createdAt: 'desc' }, include: { contact: true }});
  console.log('Latest Conv Contact:', conv?.contact?.phone);
}
test().catch(console.error).finally(() => prisma.$disconnect());
