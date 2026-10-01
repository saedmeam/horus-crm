const fs = require('fs');
let code = fs.readFileSync('src/index.ts', 'utf8');

const anchor = "const metaMessageId = metaData.messages[0].id;";
const target = "status: 'SENT'";

if (code.includes(anchor) && !code.includes(target)) {
  const findStr = `      const newMessage = await prisma.message.create({
        data: {
          conversationId: id,
          senderType: 'AGENT',
          senderUserId: req.user.id,
          content: \`[Plantilla Enviada: \${templateName}]\`,
          metaMessageId
        }
      });`;
  const repStr = `      const newMessage = await prisma.message.create({
        data: {
          conversationId: id,
          senderType: 'AGENT',
          senderUserId: req.user.id,
          content: \`[Plantilla Enviada: \${templateName}]\`,
          metaMessageId,
          status: 'SENT'
        }
      });`;
  
  if (code.includes(findStr)) {
    code = code.replace(findStr, repStr);
    fs.writeFileSync('src/index.ts', code);
    console.log('Successfully added SENT to templates');
  } else {
    console.log('findStr not found exactly in templates.');
  }
} else {
  console.log('Already injected in templates or anchor missing.');
}
