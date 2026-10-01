const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

const editDeleteRoutes = `
app.put('/api/templates/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { name, category, language, bodyText, variables, submitToMeta } = req.body;
    let status = 'LOCAL';

    if (submitToMeta) {
      const creds = await getMetaCredentials();
      const wabaId = creds.wabaId;
      const token = creds.whatsappToken;
      if (!wabaId || !token) return res.status(400).json({ error: 'Falta WABA ID o Token' });

      // Editar en Meta (Se envía igual que crear, Meta lo toma como una edición si el nombre ya existe)
      const payload = { name, category, components: [{ type: 'BODY', text: bodyText }], language };
      const metaRes = await fetch(\`https://graph.facebook.com/v17.0/\${wabaId}/message_templates\`, {
        method: 'POST',
        headers: { 'Authorization': \`Bearer \${token}\`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await metaRes.json();
      if (!metaRes.ok) return res.status(400).json({ error: 'Error de Meta', details: data });
      status = 'PENDING';
    }

    const template = await prisma.metaTemplate.update({
      where: { id },
      data: { name, category, language, bodyText, variables, status }
    });
    res.json(template);
  } catch (error: any) {
    res.status(500).json({ error: 'Error updating template', details: error.message });
  }
});

app.delete('/api/templates/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const template = await prisma.metaTemplate.findUnique({ where: { id } });
    if (!template) return res.status(404).json({ error: 'Not found' });

    // Intentar borrar de Meta
    const creds = await getMetaCredentials();
    if (creds.wabaId && creds.whatsappToken) {
      await fetch(\`https://graph.facebook.com/v17.0/\${creds.wabaId}/message_templates?name=\${template.name}\`, {
        method: 'DELETE',
        headers: { 'Authorization': \`Bearer \${creds.whatsappToken}\` }
      });
    }

    await prisma.metaTemplate.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Error deleting template' });
  }
});
`;

code = code.replace("app.post('/api/templates'", editDeleteRoutes + "\napp.post('/api/templates'");

fs.writeFileSync('backend/src/index.ts', code);
console.log("Added edit and delete routes to backend");
