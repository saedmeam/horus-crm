const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

const templateRoute = `
// --- ENVIAR PLANTILLA (WhatsApp Template) ---
app.post('/api/conversations/:id/template', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { templateName, languageCode = 'es' } = req.body;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { contact: true }
    });

    if (!conversation) return res.status(404).json({ error: 'Conversacin no encontrada' });

    // Payload para Meta
    const metaPayload = {
      messaging_product: 'whatsapp',
      to: conversation.contact.phone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode }
      }
    };

    // Llamada a WhatsApp API
    const metaRes = await axios.post(
      \`https://graph.facebook.com/v17.0/\${process.env.META_PHONE_ID}/messages\`,
      metaPayload,
      {
        headers: {
          'Authorization': \`Bearer \${process.env.WHATSAPP_TOKEN}\`,
          'Content-Type': 'application/json'
        }
      }
    );

    const metaMessageId = metaRes.data.messages[0].id;

    // Guardar en la DB
    const newMessage = await prisma.message.create({
      data: {
        conversationId: id,
        senderType: 'USER',
        senderUserId: req.user.id,
        content: \`[Plantilla Enviada: \${templateName}]\`,
        metaMessageId
      }
    });

    io.emit('new_message', newMessage);
    res.json(newMessage);
  } catch (error: any) {
    console.error('Error enviando plantilla:', error.response?.data || error);
    res.status(500).json({ error: 'Error enviando plantilla', details: error.response?.data });
  }
});

`;

// Insert the route before app.put('/api/conversations/:id/assign' or similar
code = code.replace("app.put('/api/conversations/:id/assign'", templateRoute + "app.put('/api/conversations/:id/assign'");

fs.writeFileSync('backend/src/index.ts', code);
console.log("Added template route");
