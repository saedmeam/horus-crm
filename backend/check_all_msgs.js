const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const msgs = await prisma.message.findMany({ 
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { conversation: { include: { contact: true } } }
  });
  console.log(msgs.map(m => ({ 
    type: m.senderType, 
    content: m.content, 
    time: m.createdAt, 
    status: m.status,
    phone: m.conversation.contact.phone
  })));
}
check().catch(console.error).finally(() => prisma.$disconnect());
