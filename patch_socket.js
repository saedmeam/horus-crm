const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

let regex = /const ctx = newMsg\.conversationContext;[\s\S]*?console\.log\('Ignorando mensaje, pertenece a otro agente o canal'\);\s+return;\s+\}\s+\}/;

const newLogic = `const ctx = newMsg.conversationContext;
        if (ctx) {
          const u = JSON.parse(localStorage.getItem('user') || '{}');
          const isAdmin = u.role === 'SUPERADMIN' || u.role === 'ADMIN';
          const myLineIds = u?.lines?.map((l: any) => l.id) || [];
          
          const isMine = ctx.assignedUserId === u?.id;
          const isUnassignedButInMyLine = !ctx.assignedUserId && myLineIds.includes(ctx.whatsappLineId);
          const isLegacy = !ctx.assignedUserId && !ctx.whatsappLineId;
          
          if (!isAdmin && !isMine && !isUnassignedButInMyLine && !isLegacy) {
            console.log('Ignorando mensaje, pertenece a otro agente o canal');
            return;
          }
        }`;

code = code.replace(regex, newLogic);
fs.writeFileSync('frontend/src/app/page.tsx', code);
console.log('Frontend page.tsx patched for admin websocket visibility.');
