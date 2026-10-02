const fs = require('fs');

let backendPath = 'backend/src/index.ts';
let content = fs.readFileSync(backendPath, 'utf8');

// The original file is checked out. Let's fix the typescript errors.
// Change `user.role` to `(user as any).role?.name || (user as any).role` where it causes issues.
// Wait, Prisma returns `user.role` if it was included in the query.
// Let's just use `(user as any).role?.name || (user as any).role` for all `user.role` occurrences, except inside `req.user.role`.

content = content.replace(/user\.role/g, "((user as any).role?.name || (user as any).role)");
content = content.replace(/req\.\(\(user as any\)\.role\?\.name \|\| \(user as any\)\.role\)/g, "req.user.role");

// Also apply the backend fixes
let target = "io.emit('new_message', { ...savedMessage, conversationContext: conversation });";
let parts = content.split(target);
if (parts.length >= 3) {
    let rep1 = "io.emit('new_message', { ...savedMessage, contactName: (conversation as any).contact?.name || (typeof contact !== 'undefined' ? (contact as any).name : undefined), phoneNumber: (conversation as any).contact?.phone || (typeof contact !== 'undefined' ? (contact as any).phone : undefined), conversationContext: conversation });";
    let rep2 = "io.emit('new_message', { ...savedMessage, contactName: (typeof contact !== 'undefined' ? (contact as any).name : undefined), phoneNumber: (typeof contact !== 'undefined' ? (contact as any).phone : undefined), conversationContext: conversation });";
    
    let newContent = parts[0] + rep1 + parts[1];
    for(let i=2; i<parts.length; i++){
        newContent += rep2 + parts[i];
    }
    content = newContent;
}

content = content.replace(
  /const savedMessage = await prisma\.message\.create\(\{[\s\S]*?\}\);/g,
  (match) => match + "\n      await prisma.conversation.update({ where: { id: savedMessage.conversationId }, data: { updatedAt: new Date() } }).catch(()=>{});"
);

content = content.replace(
  /const newMessage = await prisma\.message\.create\(\{[\s\S]*?Plantilla Enviada[\s\S]*?\}\);/g,
  (match) => match + "\n      await prisma.conversation.update({ where: { id: newMessage.conversationId }, data: { updatedAt: new Date() } }).catch(()=>{});"
);

fs.writeFileSync(backendPath, content);
console.log('Backend fixed locally.');
