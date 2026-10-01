const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

const target = `      const newMessage = await prisma.message.create({
        data: {
          conversationId: id,
          senderType: 'AGENT',
          senderUserId: req.user.id,
          content: \`[Plantilla Enviada: \${templateName}]\`,
          metaMessageId
        }
      });`;

const repl = `      const newMessage = await prisma.message.create({
        data: {
          conversationId: id,
          senderType: 'AGENT',
          senderUserId: req.user.id,
          content: \`[Plantilla Enviada: \${templateName}]\`,
          metaMessageId,
          status: 'SENT'
        }
      });`;

code = code.replace(target, repl);
fs.writeFileSync('backend/src/index.ts', code);
console.log('Fixed template status!');
