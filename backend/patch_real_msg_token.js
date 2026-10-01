const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

const regex = /const token = process\.env\.WHATSAPP_TOKEN;\s*let phoneNumberId = process\.env\.DEFAULT_PHONE_NUMBER_ID \|\| '';/g;
const replacement = `const creds = await getMetaCredentials();
      const token = creds.whatsappToken || process.env.WHATSAPP_TOKEN;
      let phoneNumberId = creds.phoneNumberId || process.env.DEFAULT_PHONE_NUMBER_ID || '';`;

code = code.replace(regex, replacement);
fs.writeFileSync('backend/src/index.ts', code);
console.log('Fixed token fetch in messages route!');
