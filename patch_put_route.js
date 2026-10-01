const fs = require('fs');

let code = fs.readFileSync('backend/src/index.ts', 'utf8');

const regex = /app\.put\('\/api\/templates\/:id', authenticateToken, async \(req: any, res: any\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: 'Error updating template', details: error\.message \}\);\s*\}\s*\}\);/;

const replacement = `app.put('/api/templates/:id', authenticateToken, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { name, category, language, bodyText, variables, examples, submitToMeta } = req.body;
      let status = 'LOCAL';

      const existing = await prisma.metaTemplate.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Not found' });

      if (submitToMeta) {
        const creds = await getMetaCredentials();
        const wabaId = creds.wabaId;
        const token = creds.whatsappToken;
        if (!wabaId || !token) return res.status(400).json({ error: 'Falta WABA ID o Token' });

        const varNames = JSON.parse(variables || '[]');
        const exampleValues = examples ? JSON.parse(examples) : [];
        const componentPayload: any = { type: 'BODY', text: bodyText };
        if (varNames.length > 0) {
          componentPayload.example = {
            body_text: [exampleValues.length === varNames.length ? exampleValues : varNames.map((_: any, i: number) => i === 0 ? 'Juan' : 'Impresora 3D')]
          };
        }

        let url = \`https://graph.facebook.com/v17.0/\${wabaId}/message_templates\`;
        let payload: any = { name, category, components: [componentPayload], language };

        if (existing.metaId) {
          url = \`https://graph.facebook.com/v17.0/\${existing.metaId}\`;
          payload = { components: [componentPayload] };
        }

        const metaRes = await fetch(url, {
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
  });`;

if(code.match(regex)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('backend/src/index.ts', code);
    console.log("Backend PUT route patched!");
} else {
    console.log("Regex didn't match.");
}
