const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

const regex = /app\.post\('\/api\/conversations\/:id\/template', authenticateToken, async \(req: any, res: any\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: 'Error sending template', details: error\.message \}\);\s*\}\s*\}\);/;

const replacement = `app.post('/api/conversations/:id/template', authenticateToken, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { templateName, languageCode = 'es' } = req.body;
  
      const conversation = await prisma.conversation.findUnique({
        where: { id },
        include: { contact: true, whatsappLine: true }
      });
  
      if (!conversation) return res.status(404).json({ error: 'Conversacion no encontrada' });
  
      const creds = await getMetaCredentials();
      const token = creds.whatsappToken;
      const phoneId = conversation.whatsappLine?.phoneNumberId || creds.phoneNumberId;

      if (!token || !phoneId) return res.status(400).json({ error: 'Falta Token o ID de telefono' });

      const components = [];
      if (req.body.variables && req.body.variables.length > 0) {
        components.push({
          type: 'body',
          parameters: req.body.variables.map((val: string) => ({
            type: 'text',
            text: val
          }))
        });
      }
  
      const metaPayload: any = {
        messaging_product: 'whatsapp',
        to: conversation.contact.phone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode }
        }
      };
  
      if (components.length > 0) {
        metaPayload.template.components = components;
      }
  
      const metaRes = await fetch(
        \`https://graph.facebook.com/v17.0/\${phoneId}/messages\`,
        {
          method: 'POST',
          headers: {
            'Authorization': \`Bearer \${token}\`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(metaPayload)
        }
      );
  
      const metaData = await metaRes.json();
      if (!metaRes.ok) throw new Error(metaData.error?.message || 'Error de Meta');

      let simulatedText = \`[Plantilla: \${templateName}]\`;
      if (req.body.variables && req.body.variables.length > 0) {
         simulatedText += \` - Variables: \${req.body.variables.join(', ')}\`;
      }
  
      const newMessage = await prisma.message.create({
        data: {
          conversationId: id,
          senderType: 'AGENT',
          agentId: req.user.id,
          messageType: 'TEMPLATE',
          content: simulatedText,
          status: 'SENT',
          whatsappMessageId: metaData.messages?.[0]?.id || \`template-\${Date.now()}\`
        }
      });
  
      io.to(id).emit('newMessage', newMessage);
      res.json(newMessage);
    } catch (error: any) {
      res.status(500).json({ error: 'Error sending template', details: error.message });
    }
  });`;

code = code.replace(regex, replacement);
fs.writeFileSync('backend/src/index.ts', code);
console.log("Backend Route patched!");
