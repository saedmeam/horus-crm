const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

const targetTemplate = `      // Llamada a WhatsApp API
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

const replTemplate = `      // Llamada a WhatsApp API
      const creds = await getMetaCredentials();
      const metaPhoneId = creds.defaultPhoneId || process.env.META_PHONE_ID;
      const metaToken = creds.whatsappToken || process.env.WHATSAPP_TOKEN;
      
      const metaRes = await fetch(
        \`https://graph.facebook.com/v17.0/\${metaPhoneId}/messages\`,
        {
          method: 'POST',
          headers: {
            'Authorization': \`Bearer \${metaToken}\`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(metaPayload)
        }
      );`;

code = code.replace(targetTemplate, replTemplate);

const targetMessages = `      const token = process.env.WHATSAPP_TOKEN;
      let phoneNumberId = process.env.DEFAULT_PHONE_NUMBER_ID || '';`;

const replMessages = `      const creds = await getMetaCredentials();
      const token = creds.whatsappToken || process.env.WHATSAPP_TOKEN;
      let phoneNumberId = creds.defaultPhoneId || process.env.DEFAULT_PHONE_NUMBER_ID || '';`;

code = code.replace(targetMessages, replMessages);

fs.writeFileSync('backend/src/index.ts', code);
console.log('Patched Meta Credentials dynamically in messages and templates!');
