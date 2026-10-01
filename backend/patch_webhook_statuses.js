const fs = require('fs');
let code = fs.readFileSync('src/index.ts', 'utf8');

const anchor = `if (change.value && change.value.messages) {`;
const injection = `if (change.value && change.value.statuses) {
            for (const statusObj of change.value.statuses) {
              const messageId = statusObj.id;
              const status = statusObj.status; // 'sent', 'delivered', 'read', 'failed'
              if (messageId) {
                const existingMessage = await prisma.message.findUnique({ where: { metaMessageId: messageId } });
                if (existingMessage) {
                  await prisma.message.update({
                    where: { metaMessageId: messageId },
                    data: { status: status.toUpperCase() }
                  });
                  io.emit('message_status_update', { 
                    metaMessageId: messageId, 
                    status: status.toUpperCase(), 
                    conversationId: existingMessage.conversationId 
                  });
                }
              }
            }
          }
          
          if (change.value && change.value.messages) {`;

if (!code.includes('change.value.statuses')) {
  code = code.replace(anchor, injection);
  fs.writeFileSync('src/index.ts', code);
  console.log('Successfully added statuses logic to webhook!');
} else {
  console.log('Statuses logic already exists.');
}
