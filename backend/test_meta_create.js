const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMeta() {
  const setting = await prisma.systemSetting.findUnique({ where: { id: 'default' } });
  const data = setting?.data || {};
  const wabaId = data.WABA_ID;
  const token = data.WHATSAPP_TOKEN;

  const payload = {
    name: "promo_descuento_especial",
    category: "MARKETING",
    language: "es",
    components: [
      {
        type: "BODY",
        text: "Hola {{1}}, tenemos un 20% de descuento en nuestra tienda para ti hoy.",
        example: {
          body_text: [["Carlos"]]
        }
      }
    ]
  };

  console.log("Enviando a Meta...");
  const res = await fetch(`https://graph.facebook.com/v17.0/${wabaId}/message_templates`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const json = await res.json();
  console.log("Respuesta:", json);
}
testMeta().catch(console.error);
