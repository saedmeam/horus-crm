const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMeta() {
  const setting = await prisma.systemSetting.findUnique({ where: { id: 'default' } });
  const data = setting?.data || {};
  const wabaId = data.WABA_ID;
  const token = data.WHATSAPP_TOKEN;

  const payload = {
    name: "notificacion_pedido_bodega",
    category: "UTILITY",
    language: "es",
    components: [
      {
        type: "BODY",
        text: "Hola {{1}}, te confirmamos que tu equipo {{2}} se encuentra actualmente en nuestra bodega.",
        example: {
          body_text: [["Carlos", "Impresora 3D"]]
        }
      }
    ]
  };

  console.log("Enviando UTILITY a Meta...");
  const res = await fetch(`https://graph.facebook.com/v17.0/${wabaId}/message_templates`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const json = await res.json();
  console.log("Respuesta:", json);
}
testMeta().catch(console.error);
