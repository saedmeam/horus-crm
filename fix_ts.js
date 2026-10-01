const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

// 1. Fix axios -> fetch
const axiosCall = `const metaRes = await axios.post(
      \`https://graph.facebook.com/v17.0/\${process.env.META_PHONE_ID}/messages\`,
      metaPayload,
      {
        headers: {
          'Authorization': \`Bearer \${process.env.WHATSAPP_TOKEN}\`,
          'Content-Type': 'application/json'
        }
      }
    );

    const metaMessageId = metaRes.data.messages[0].id;`;

const fetchCall = `const metaRes = await fetch(
      \`https://graph.facebook.com/v17.0/\${process.env.META_PHONE_ID}/messages\`,
      {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${process.env.WHATSAPP_TOKEN}\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metaPayload)
      }
    );

    const metaData = await metaRes.json();
    if (!metaRes.ok) throw new Error(metaData.error?.message || 'Error Meta');
    const metaMessageId = metaData.messages[0].id;`;

code = code.replace(axiosCall, fetchCall);

// 2. Fix senderType: 'USER' -> senderType: 'AGENT'
code = code.replace("senderType: 'USER',", "senderType: 'AGENT',");

fs.writeFileSync('backend/src/index.ts', code);
console.log("Fixed typescript errors");
