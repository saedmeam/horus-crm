const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

const regex1 = /io\.emit\('message_status_update',\s*\{\s*metaMessageId:\s*metaData\.messages\[0\]\.id,\s*status:\s*'SENT',\s*conversationId:\s*savedMessage\.conversationId\s*\}\);/g;
const repl1 = `io.emit('message_status_update', { id: savedMessage.id, metaMessageId: metaData.messages[0].id, status: 'SENT', conversationId: savedMessage.conversationId });`;

const regex2 = /io\.emit\('message_status_update',\s*\{\s*metaMessageId:\s*messageId,\s*status:\s*status\.toUpperCase\(\),\s*conversationId:\s*existingMessage\.conversationId\s*\}\);/g;
const repl2 = `io.emit('message_status_update', { id: existingMessage.id, metaMessageId: messageId, status: status.toUpperCase(), conversationId: existingMessage.conversationId });`;

code = code.replace(regex1, repl1);
code = code.replace(regex2, repl2);

fs.writeFileSync('backend/src/index.ts', code);
console.log('Fixed backend message_status_update payloads');
