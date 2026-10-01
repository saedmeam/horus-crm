const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

const settingsRoutes = `
// --- SYSTEM SETTINGS ---
app.get('/api/settings', authenticateToken, async (req: any, res: any) => {
  try {
    let setting = await prisma.systemSetting.findUnique({ where: { id: 'default' } });
    if (!setting) {
      setting = await prisma.systemSetting.create({ data: { id: 'default', data: {} } });
    }
    res.json(setting.data);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching settings' });
  }
});

app.put('/api/settings', authenticateToken, async (req: any, res: any) => {
  try {
    const newData = req.body;
    let setting = await prisma.systemSetting.findUnique({ where: { id: 'default' } });
    
    let mergedData = newData;
    if (setting && setting.data) {
      mergedData = { ...(setting.data as object), ...newData };
    }

    const updated = await prisma.systemSetting.upsert({
      where: { id: 'default' },
      update: { data: mergedData },
      create: { id: 'default', data: mergedData }
    });
    res.json(updated.data);
  } catch (error) {
    res.status(500).json({ error: 'Error updating settings' });
  }
});
`;

code = code.replace("// --- GESTION DE PLANTILLAS META ---", settingsRoutes + "\n// --- GESTION DE PLANTILLAS META ---");
fs.writeFileSync('backend/src/index.ts', code);
console.log("Added settings routes");
