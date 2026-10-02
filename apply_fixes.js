const fs = require('fs');

// 1. BACKEND
let backendPath = 'backend/src/index.ts';
let content = fs.readFileSync(backendPath, 'utf8');

// Fix contactName
let target = "io.emit('new_message', { ...savedMessage, conversationContext: conversation });";
let parts = content.split(target);
if (parts.length >= 3) {
    let rep1 = "io.emit('new_message', { ...savedMessage, contactName: (conversation as any).contact?.name, phoneNumber: (conversation as any).contact?.phone, conversationContext: conversation });";
    let rep2 = "io.emit('new_message', { ...savedMessage, contactName: contact.name, phoneNumber: contact.phone, conversationContext: conversation });";
    
    let newContent = parts[0] + rep1 + parts[1];
    for(let i=2; i<parts.length; i++){
        newContent += rep2 + parts[i];
    }
    content = newContent;
}

// Fix updatedAt
content = content.replace(
  /const savedMessage = await prisma\.message\.create\(\{[\s\S]*?\}\);/g,
  (match) => match + "\n      await prisma.conversation.update({ where: { id: savedMessage.conversationId }, data: { updatedAt: new Date() } });"
);

content = content.replace(
  /const newMessage = await prisma\.message\.create\(\{[\s\S]*?Plantilla Enviada[\s\S]*?\}\);/g,
  (match) => match + "\n      await prisma.conversation.update({ where: { id: newMessage.conversationId }, data: { updatedAt: new Date() } });"
);

fs.writeFileSync(backendPath, content);
console.log('Backend fixed locally.');

// 2. FRONTEND GLOBAL ALERTS
let frontendPath = 'frontend/src/components/GlobalAlerts.tsx';
let globalAlertsCode = `"use client";
import { useEffect, useState } from 'react';
import { AlarmClock, X, Bell } from 'lucide-react';
import { io } from 'socket.io-client';

export default function GlobalAlerts() {
  const [activeAlert, setActiveAlert] = useState<any>(null);
  const [msgToasts, setMsgToasts] = useState<any[]>([]);
  const [permission, setPermission] = useState('granted');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPerm = async () => {
    if ('Notification' in window) {
      const p = await Notification.requestPermission();
      setPermission(p);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    let socket: any;
    
    if (token && userData) {
      const user = JSON.parse(userData);
      socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001');
      socket.on('new_message', (newMsg: any) => {
        const ctx = newMsg.conversationContext;
        if (ctx && newMsg.senderType === 'CLIENT') {
          const canViewAll = user?.roleData?.canViewAllChats === true || user?.role?.name === 'SUPERADMIN' || user?.role === 'SUPERADMIN' || user?.role?.name === 'ADMIN' || user?.role === 'ADMIN';
          const myLineIds = user?.lines?.map((l: any) => l.id) || [];
          const isMine = ctx.assignedUserId === user?.id;
          const isUnassignedButInMyLine = !ctx.assignedUserId && myLineIds.includes(ctx.whatsappLineId);
          const isLegacy = !ctx.assignedUserId && !ctx.whatsappLineId;
          
          if (!canViewAll && !isMine && !isUnassignedButInMyLine && !isLegacy) return;

          const contactName = newMsg.contactName || newMsg.phoneNumber || 'Desconocido';
          const preview = newMsg.content?.substring(0, 50) || '📷 Archivo adjunto';

          const audioUrl = localStorage.getItem('msgSound') || '/sounds/message.mp3';
          const audio = new Audio(audioUrl);
          audio.play().catch(e => console.log('Audio automático bloqueado', e));

          if (window.location.pathname !== '/' || !document.hasFocus()) {
            const newToast = { id: Date.now(), name: contactName, text: preview };
            setMsgToasts(prev => [...prev, newToast]);
            setTimeout(() => setMsgToasts(prev => prev.filter(t => t.id !== newToast.id)), 5000);
          }

          if (!document.hasFocus()) {
            document.title = \`(1) \${contactName}\`;
            if ('Notification' in window && Notification.permission === 'granted') {
              const notif = new Notification(\`Mensaje de \${contactName}\`, { body: preview, icon: '/logo-icon.png' });
              notif.onclick = function() { window.focus(); };
            }
          }
        }
      });
    }

    const onFocus = () => { document.title = 'Horustech CRM'; };
    window.addEventListener('focus', onFocus);

    return () => { 
      if(socket) socket.disconnect(); 
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    const fetchRemindersAndCheck = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch(\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/reminders\`, { headers: { 'Authorization': 'Bearer ' + token } });
        if (res.ok) {
          const reminders = await res.json();
          const now = new Date();
          const due = reminders.find((r: any) => {
            if (r.isCompleted) return false;
            return new Date(r.scheduledFor) <= now && !localStorage.getItem('alerted_' + r.id);
          });
          if (due) {
            localStorage.setItem('alerted_' + due.id, 'true');
            setActiveAlert(due);
            new Audio(localStorage.getItem('alarmSound') || '/sounds/reminder.mp3').play().catch(()=>{});
          }
        }
      } catch (err) {}
    };
    const interval = setInterval(fetchRemindersAndCheck, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {permission === 'default' && (
        <div onClick={requestPerm} className="fixed top-0 left-0 right-0 bg-blue-600 text-white p-3 z-[10000] flex justify-center items-center gap-3 cursor-pointer shadow-md hover:bg-blue-700 transition-all">
          <Bell size={20} className="animate-bounce" />
          <span className="font-semibold text-sm">Clic aquí para activar las notificaciones nativas de escritorio</span>
        </div>
      )}
      {activeAlert && (
        <div className="fixed bottom-4 right-4 z-[9999] animate-bounce">
          <div className="bg-red-600 text-white p-6 rounded-2xl shadow-2xl flex flex-col gap-3 w-80 border-4 border-red-400">
            <button onClick={() => setActiveAlert(null)} className="absolute top-2 right-2 hover:bg-red-700 rounded-full p-1"><X size={20} /></button>
            <div className="flex items-center gap-3"><AlarmClock size={32} className="animate-pulse" /><h3 className="font-bold text-xl">¡RECORDATORIO!</h3></div>
            <p className="text-red-50">{activeAlert.notes}</p>
          </div>
        </div>
      )}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {msgToasts.map(toast => (
          <div key={toast.id} onClick={() => window.location.href = '/'} className="pointer-events-auto bg-white cursor-pointer rounded-2xl shadow-2xl border p-4 w-80 flex gap-4 hover:bg-gray-50">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shrink-0"><span className="text-white font-bold text-xl">{toast.name.charAt(0).toUpperCase()}</span></div>
            <div className="flex flex-col flex-1 overflow-hidden justify-center"><span className="font-bold text-gray-900 truncate">{toast.name}</span><span className="text-sm text-gray-500 truncate">{toast.text}</span></div>
          </div>
        ))}
      </div>
    </>
  );
}`;
fs.writeFileSync(frontendPath, globalAlertsCode);
console.log('Frontend GlobalAlerts fixed locally.');

// 3. FIX page.tsx to ensure there are no syntax errors
let pagePath = 'frontend/src/app/page.tsx';
let pageContent = fs.readFileSync(pagePath, 'utf8');

let re1 = /if\s*\(newMsg\.senderType === 'CLIENT'\)\s*\{\s*try\s*\{\s*const audio = new Audio\('[^']+'\);\s*audio\.play\(\)\.catch[^\}]+\}\s*catch\(e\)\s*\{\}\s*\}/g;
let re2 = /if\s*\(newMsg\.senderType === 'CLIENT' \|\| newMsg\.senderType === 'USER'\)\s*\{\s*try\s*\{[\s\S]*?catch\s*\(err\)\s*\{\s*console\.error\('Error notificaciones:', err\);\s*\}\s*\}/g;

pageContent = pageContent.replace(re1, '');
pageContent = pageContent.replace(re2, '');
pageContent = pageContent.replace(/\}\s*\}\s*\}\s*setMessages\(prev/g, "}\n          }\n\n        setMessages(prev");
fs.writeFileSync(pagePath, pageContent);
console.log('Frontend page.tsx cleaned locally.');
