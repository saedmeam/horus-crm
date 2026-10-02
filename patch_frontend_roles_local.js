const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

const regex = /const ctx = newMsg\.conversationContext;[\s\S]*?console\.log\('Ignorando mensaje, pertenece a otro agente o canal'\);\s+return;\s+\}\s+\}/;

const newCode = `const ctx = newMsg.conversationContext;
          if (ctx) {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const canViewAll = currentUser?.roleData?.canViewAllChats === true || currentUser?.role?.name === 'SUPERADMIN' || currentUser?.role === 'SUPERADMIN';
            
            const myLineIds = currentUser?.lines?.map((l) => l.id) || [];
            const isMine = ctx.assignedUserId === currentUser?.id;
            const isUnassignedButInMyLine = !ctx.assignedUserId && myLineIds.includes(ctx.whatsappLineId);
            const isLegacy = !ctx.assignedUserId && !ctx.whatsappLineId;
            
            if (!canViewAll && !isMine && !isUnassignedButInMyLine && !isLegacy) {
              return;
            }
          }`;

code = code.replace(regex, newCode);
fs.writeFileSync('frontend/src/app/page.tsx', code);
console.log('Frontend patched.');
