const fs = require('fs');
let code = fs.readFileSync('src/index.ts', 'utf8');

const anchor = "console.log('Respuesta de Meta:', metaData);";
if (code.includes(anchor) && !code.includes('if (metaData.error)')) {
  const insertion = `
          if (metaData.error) {
             return res.status(400).json({ error: 'Meta Error: ' + metaData.error.message });
          }
          if (metaData.messages && metaData.messages[0]) {
             await prisma.message.update({
               where: { id: savedMessage.id },
               data: { metaMessageId: metaData.messages[0].id, status: 'SENT' }
             });
             io.emit('message_status_update', { 
               metaMessageId: metaData.messages[0].id, 
               status: 'SENT', 
               conversationId: savedMessage.conversationId 
             });
          }
`;
  code = code.replace(anchor, anchor + insertion);
  fs.writeFileSync('src/index.ts', code);
  console.log('Successfully injected error checking and SENT status updating!');
} else {
  console.log('Anchor not found or already injected.');
}
