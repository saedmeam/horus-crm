const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

code = code.replace(/app\.get\('\/api\/settings', authenticateToken, async \(req: any, res: any\) => \{\s+try \{\s+let setting = await prisma\.systemSetting/g, 
  "app.get('/api/meta-settings', authenticateToken, async (req: any, res: any) => {\n    try {\n      let setting = await prisma.systemSetting");

code = code.replace(/app\.put\('\/api\/settings', authenticateToken, async \(req: any, res: any\) => \{\s+try \{\s+const newData = req\.body;\s+let setting = await prisma\.systemSetting/g, 
  "app.put('/api/meta-settings', authenticateToken, async (req: any, res: any) => {\n    try {\n      const newData = req.body;\n      let setting = await prisma.systemSetting");

fs.writeFileSync('backend/src/index.ts', code);
