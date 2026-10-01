const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

const target = `            io.emit('new_message', { ...savedMessage, conversationContext: conversation });
          }`;

const repl = `            io.emit('new_message', { ...savedMessage, conversationContext: conversation });
          }
          if (change.value && change.value.statuses) {
            for (const statusObj of change.value.statuses) {
              const messageId = statusObj.id;
              const status = statusObj.status;
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
          }`;

code = code.replace(target, repl);
fs.writeFileSync('backend/src/index.ts', code);
console.log('Fixed statuses in backend!');
