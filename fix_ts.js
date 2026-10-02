const fs = require('fs');
let content = fs.readFileSync('backend/src/index.ts', 'utf8');
content = content.replace(/user\.role === 'SUPERADMIN'/g, "(user as any).role === 'SUPERADMIN' || (user as any).role?.name === 'SUPERADMIN'");
content = content.replace(/user\.role === 'ADMIN'/g, "(user as any).role === 'ADMIN' || (user as any).role?.name === 'ADMIN'");
content = content.replace(/user\.role/g, "(user as any).role");
fs.writeFileSync('backend/src/index.ts', content);
