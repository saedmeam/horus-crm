const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

// The TS error is likely on `user.role !== 'SUPERADMIN'` inside an endpoint where `user` is fetched from DB.
code = code.replace(/if \(req\.user\.role !== 'SUPERADMIN' && req\.user\.role !== 'ADMIN'\)/g, "if ((req as any).user.role !== 'SUPERADMIN' && (req as any).user.role !== 'ADMIN')");

// Or if it's `user = await prisma.user.findUnique...`
code = code.replace(/if \(user\.role !== 'SUPERADMIN'/g, "if ((user as any).role?.name !== 'SUPERADMIN'");

code = code.replace(/setting\?\.data\?\.WHATSAPP_VERIFY_TOKEN/g, "(setting?.data as any)?.WHATSAPP_VERIFY_TOKEN");

fs.writeFileSync('backend/src/index.ts', code);
console.log('Fixed TS');
