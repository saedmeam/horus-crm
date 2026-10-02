const fs = require('fs');

let backendPath = 'backend/src/index.ts';
let content = fs.readFileSync(backendPath, 'utf8');

// Replace the last one
let parts = content.split("io.emit('new_message', { ...savedMessage, contactName: (undefined), phoneNumber: (undefined), conversationContext: conversation });");
if (parts.length === 2) {
    content = parts[0] + "io.emit('new_message', { ...savedMessage, contactName: contact.name, phoneNumber: contact.phone, conversationContext: conversation });" + parts[1];
}

fs.writeFileSync(backendPath, content);
console.log('Backend contact name fixed locally.');
