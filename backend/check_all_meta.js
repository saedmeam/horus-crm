const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const setting = await prisma.systemSetting.findUnique({ where: { id: 'default' } });
  const data = setting?.data || {};
  const wabaId = data.WABA_ID;
  const token = data.WHATSAPP_TOKEN;

  const res = await fetch(`https://graph.facebook.com/v17.0/${wabaId}/message_templates`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const json = await res.json();
  if (json.data) {
    console.log("TODAS LAS PLANTILLAS EN META:");
    json.data.forEach(t => {
      console.log(`- Nombre: ${t.name} | Estado: ${t.status} | Idioma: ${t.language}`);
    });
  } else {
    console.log("Error:", json);
  }
}
check().catch(console.error);
