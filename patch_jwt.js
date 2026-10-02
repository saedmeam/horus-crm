const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');
code = code.replace(/\{ id: user\.id, role: user\.role, email: user\.email \}/g, '{ id: user.id, role: user.role?.name || "SALES", roleData: user.role, email: user.email }');
fs.writeFileSync('backend/src/index.ts', code);
console.log('Fixed login token');
