const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMetaError() {
  const setting = await prisma.systemSetting.findUnique({ where: { id: 'default' } });
  const data = setting?.data || {};
  const wabaId = data.WABA_ID;
  const token = data.WHATSAPP_TOKEN;

  const payload = {
    name: "confirmar_stock",
    category: "UTILITY",
    language: "es",
    components: [
      {
        type: "BODY",
        text: "Hola {{1}}, te escribimos de Soporte3D para notificarte que el inventario de {{2}} correspondiente a tu orden ya se encuentra actualizado y disponible en nuestra bodega. ¡Gracias por tu paciencia!",
        example: {
          body_text: [["Santiago", "Resina 3D"]]
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
  console.log("Respuesta Meta:", JSON.stringify(json, null, 2));
}

checkMetaError().catch(console.error);
