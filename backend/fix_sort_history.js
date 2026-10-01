const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const convs = await prisma.conversation.findMany({
    include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } }
  });
  
  for (const c of convs) {
    if (c.messages.length > 0) {
      await prisma.conversation.update({
        where: { id: c.id },
        data: { updatedAt: c.messages[0].createdAt }
      });
    }
  }
  console.log('Fixed historical sorting!');
}

fix().catch(console.error).finally(() => prisma.$disconnect());
