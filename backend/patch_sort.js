const fs = require('fs');
let code = fs.readFileSync('src/index.ts', 'utf8');

// 1. Webhook
const webhookAnchor = `const savedMessage = await prisma.message.create({
                data: {
                  conversationId: conversation.id,
                  senderType: 'CLIENT',
                  content: text,
                  mediaType: mediaType,
                  mediaUrl: mediaUrl,
                  metaMessageId: messageId,
                  status: 'RECEIVED'
                }
              });`;
const webhookRepl = `${webhookAnchor}
              await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });`;
code = code.replace(webhookAnchor, webhookRepl);

// 2. /messages
const msgAnchor = `const savedMessage = await prisma.message.create({
        data: {
          conversationId: id,
          senderType: 'AGENT',
          content,
          mediaUrl: mediaUrl || null,
          mediaType: mediaType || 'TEXT'
        }
      });`;
const msgRepl = `${msgAnchor}
      await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });`;
code = code.replace(msgAnchor, msgRepl);

// 3. /template
const templateAnchor = `const newMessage = await prisma.message.create({
        data: {
          conversationId: id,
          senderType: 'AGENT',
          senderUserId: req.user.id,
          content: \`[Plantilla Enviada: \${templateName}]\`,
          metaMessageId,
          status: 'SENT'
        }
      });`;
const templateRepl = `${templateAnchor}
      await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });`;
code = code.replace(templateAnchor, templateRepl);

fs.writeFileSync('src/index.ts', code);
console.log('Fixed conversation sorting by updating updatedAt!');
