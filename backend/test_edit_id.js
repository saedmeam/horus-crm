const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMetaError() {
  const setting = await prisma.systemSetting.findUnique({ where: { id: 'default' } });
  const data = setting?.data || {};
  const wabaId = data.WABA_ID;
  const token = data.WHATSAPP_TOKEN;

  // El template "saludo" en la DB tiene un metaId
  const template = await prisma.metaTemplate.findFirst({where: {name: 'saludo'}});

  const payload = {
    components: [
      {
        type: "BODY",
        text: "Hola {{1}}, su pedido está listo.",
        example: {
          body_text: [["Santiago"]]
        }
      }
    ]
  };

  console.log("Enviando a Meta...");
  const res = await fetch(`https://graph.facebook.com/v17.0/${template.metaId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const json = await res.json();
  console.log("Respuesta Meta:", JSON.stringify(json, null, 2));
}

checkMetaError().catch(console.error);
