const fs = require('fs');
let backendPath = 'backend/src/index.ts';
let content = fs.readFileSync(backendPath, 'utf8');

content = content.replace(
  /const user = await prisma\.user\.findUnique\(\{\s*where: \{ id: req\.user\.id \},\s*include: \{ lines: true \}\s*\}\);/g,
  "const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { lines: true, role: true } });"
);

fs.writeFileSync(backendPath, content);
console.log('Fixed Prisma includes for user queries!');
