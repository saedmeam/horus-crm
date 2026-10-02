const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');
code = code.replace(
  /io\.emit\('new_message', \{ \.\.\.savedMessage, conversationContext: conversation \}\);/g,
  "io.emit('new_message', { ...savedMessage, contactName: typeof contact !== 'undefined' && contact ? contact.name : undefined, phoneNumber: typeof contact !== 'undefined' && contact ? contact.phone : undefined, conversationContext: conversation });"
);
fs.writeFileSync('backend/src/index.ts', code);
console.log('Patched index.ts');
