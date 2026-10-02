const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

const oldCode = /console\.log\('Ignorando mensaje, pero verificando si soy admin\.\.\.'\);[\s\S]*?console\.log\('Permitido: Soy Admin\/Superadmin\.'\);/;
const newCode = `console.log('Verificando acceso a todos los chats...');
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const canViewAll = currentUser?.roleData?.canViewAllChats === true || currentUser?.role?.name === 'SUPERADMIN';
            
            const myLineIds = currentUser?.lines?.map((l) => l.id) || [];
            const isMine = ctx.assignedUserId === currentUser?.id;
            const isUnassignedButInMyLine = !ctx.assignedUserId && myLineIds.includes(ctx.whatsappLineId);
            const isLegacy = !ctx.assignedUserId && !ctx.whatsappLineId;
            
            if (!canViewAll && !isMine && !isUnassignedButInMyLine && !isLegacy) {
              console.log('Bloqueado: No tengo permiso para ver todos los chats ni soy dueño.');
              return;
            }`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('frontend/src/app/page.tsx', code);
console.log('Frontend patched.');
