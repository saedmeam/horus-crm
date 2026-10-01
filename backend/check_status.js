const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const msgs = await prisma.message.findMany({ 
    where: { senderType: 'AGENT' },
    orderBy: { createdAt: 'desc' },
    take: 3
  });
  console.log(msgs.map(m => ({ content: m.content, status: m.status, metaId: m.metaMessageId })));
}
check().catch(console.error).finally(() => prisma.$disconnect());
