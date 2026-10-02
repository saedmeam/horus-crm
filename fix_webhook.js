const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

const oldGet = /app\.get\('\/webhook\/whatsapp', \(req, res\) => \{[\s\S]*?res\.sendStatus\(403\);\s+\}\s+\}\);/g;

const newGet = `app.get('/webhook/whatsapp', async (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  let validToken = process.env.WHATSAPP_VERIFY_TOKEN;
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { id: 'default' } });
    if (setting && setting.data && setting.data.WHATSAPP_VERIFY_TOKEN) {
      validToken = setting.data.WHATSAPP_VERIFY_TOKEN;
    }
  } catch (e) {
    console.error('Error fetching verify token from DB', e);
  }

  if (mode === 'subscribe' && token === validToken) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});`;

code = code.replace(oldGet, newGet);
fs.writeFileSync('backend/src/index.ts', code);
console.log('Done');
