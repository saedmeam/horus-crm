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
    const rejected = json.data.filter(t => t.status === 'REJECTED');
    console.log("REJECTED TEMPLATES:");
    rejected.forEach(r => {
      console.log(`- ${r.name} (${r.language}): ${r.rejected_reason || 'No reason provided'}`);
    });
  } else {
    console.log("Error fetching from Meta:", json);
  }
}
check().catch(console.error);
