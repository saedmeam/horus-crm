const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

code = code.replace(/setting\.data\.WHATSAPP_VERIFY_TOKEN/g, "(setting.data as any).WHATSAPP_VERIFY_TOKEN");
code = code.replace(/data\.WHATSAPP_VERIFY_TOKEN/g, "(data as any).WHATSAPP_VERIFY_TOKEN");
code = code.replace(/const isAdmin = user\.role === 'SUPERADMIN' \|\| user\.role === 'ADMIN';/g, "const isAdmin = (user as any).role?.name === 'SUPERADMIN' || (user as any).role?.name === 'ADMIN';");

fs.writeFileSync('backend/src/index.ts', code);
