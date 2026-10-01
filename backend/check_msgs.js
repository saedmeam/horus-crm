const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const msgs = await prisma.message.findMany({ 
    where: { conversation: { contact: { phone: '593993995471' } } },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(msgs.map(m => ({ type: m.senderType, content: m.content, time: m.createdAt, status: m.status })));
}
check().catch(console.error).finally(() => prisma.$disconnect());
