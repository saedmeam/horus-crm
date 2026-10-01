const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

const oldCode = `      // Llamada a WhatsApp API
      const metaRes = await fetch(
        \`https://graph.facebook.com/v17.0/\${process.env.META_PHONE_ID}/messages\`,
        {
          method: 'POST',
          headers: {
            'Authorization': \`Bearer \${process.env.WHATSAPP_TOKEN}\`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(metaPayload)
        }
      );`;

const newCode = `      // Llamada a WhatsApp API
      const creds = await getMetaCredentials();
      const metaRes = await fetch(
        \`https://graph.facebook.com/v17.0/\${creds.phoneNumberId || process.env.META_PHONE_ID}/messages\`,
        {
          method: 'POST',
          headers: {
            'Authorization': \`Bearer \${creds.whatsappToken || process.env.WHATSAPP_TOKEN}\`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(metaPayload)
        }
      );`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('backend/src/index.ts', code);
console.log('Fixed template token and phone ID properly!');
