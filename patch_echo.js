const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

const anchor = `const savedMessage = await prisma.message.create({
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

const replacement = `const isEcho = messageObj.from !== phone;
              const savedMessage = await prisma.message.create({
                data: {
                  conversationId: conversation.id,
                  senderType: isEcho ? 'AGENT' : 'CLIENT',
                  content: text,
                  mediaType: mediaType,
                  mediaUrl: mediaUrl,
                  metaMessageId: messageId,
                  status: isEcho ? 'SENT' : 'RECEIVED'
                }
              });`;

if (code.includes(anchor)) {
  code = code.replace(anchor, replacement);
  fs.writeFileSync('backend/src/index.ts', code);
  console.log('SUCCESS: fixed senderType for message echoes');
} else {
  // Regex fallback
  const regex = /const savedMessage = await prisma\.message\.create\(\{\s*data: \{\s*conversationId: conversation\.id,\s*senderType: 'CLIENT',\s*content: text,\s*mediaType: mediaType,\s*mediaUrl: mediaUrl,\s*metaMessageId: messageId,\s*status: 'RECEIVED'\s*\}\s*\}\);/g;
  if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('backend/src/index.ts', code);
    console.log('SUCCESS: fixed senderType for message echoes via regex');
  } else {
    console.log('FAILED to find the create block');
  }
}
