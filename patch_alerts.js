const fs = require('fs');

// Patch GlobalAlerts.tsx
let alerts = fs.readFileSync('frontend/src/components/GlobalAlerts.tsx', 'utf8');
if (!alerts.includes('io(')) {
  alerts = alerts.replace("import { AlarmClock, X } from 'lucide-react';", 
    "import { AlarmClock, X } from 'lucide-react';\nimport { io } from 'socket.io-client';");

  alerts = alerts.replace('useEffect(() => {', `useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    let socket;
    if (token && userData) {
      const user = JSON.parse(userData);
      socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001');
      socket.on('new_message', (newMsg: any) => {
        const ctx = newMsg.conversationContext;
        if (ctx && newMsg.senderType === 'CLIENT') {
          const canViewAll = user?.roleData?.canViewAllChats === true || user?.role?.name === 'SUPERADMIN' || user?.role === 'SUPERADMIN';
          const myLineIds = user?.lines?.map((l: any) => l.id) || [];
          const isMine = ctx.assignedUserId === user?.id;
          const isUnassignedButInMyLine = !ctx.assignedUserId && myLineIds.includes(ctx.whatsappLineId);
          const isLegacy = !ctx.assignedUserId && !ctx.whatsappLineId;
          
          if (!canViewAll && !isMine && !isUnassignedButInMyLine && !isLegacy) {
            return;
          }

          // Emitir mesh alert global
          if (window.location.pathname !== '/') {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(e => console.log('Audio error', e));
            window.dispatchEvent(new CustomEvent('app-alert', { detail: { message: 'Mensaje nuevo en WhatsApp', type: 'info' } }));
          }
        }
      });
    }
    return () => { if(socket) socket.disconnect(); };
  }, []);

  useEffect(() => {`);

  fs.writeFileSync('frontend/src/components/GlobalAlerts.tsx', alerts);
}

// Patch users/page.tsx alerts
let usersPage = fs.readFileSync('frontend/src/app/admin/users/page.tsx', 'utf8');
usersPage = usersPage.split("alert('Error al actualizar usuario')").join("window.dispatchEvent(new CustomEvent('app-alert', { detail: { message: 'Error al actualizar usuario', type: 'error' } }))");
usersPage = usersPage.split("alert('Error guardando usuario')").join("window.dispatchEvent(new CustomEvent('app-alert', { detail: { message: 'Error guardando usuario', type: 'error' } }))");
usersPage = usersPage.split("alert('Error en el servidor')").join("window.dispatchEvent(new CustomEvent('app-alert', { detail: { message: 'Error en el servidor', type: 'error' } }))");
fs.writeFileSync('frontend/src/app/admin/users/page.tsx', usersPage);

console.log('Patched alerts');
