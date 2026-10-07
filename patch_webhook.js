const fs = require('fs');

let f = fs.readFileSync('backend/src/index.ts', 'utf8');

f = f.replace(
  /let conversation = await prisma\.conversation\.findFirst\(\{\s*where: \{ contactId: contact\.id \},\s*orderBy: \{ createdAt: 'desc' \}\s*\}\);/,
  `let conversation = await prisma.conversation.findFirst({
              where: { 
                contactId: contact.id,
                whatsappLineId: whatsappLine ? whatsappLine.id : null
              },
              orderBy: { createdAt: 'desc' }
            });`
);

fs.writeFileSync('backend/src/index.ts', f);
console.log('Webhook patched for multi-line conversation segregation');
