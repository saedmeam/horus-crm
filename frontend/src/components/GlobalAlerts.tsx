"use client";
import { useEffect, useRef, useState } from 'react';
import { AlarmClock, X, Bell } from 'lucide-react';
import { io } from 'socket.io-client';

// Desbloquea el autoplay de audio del navegador en la primera interacción del usuario.
let audioUnlocked = false;
function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  try {
    const a = new Audio('/sounds/message.mp3');
    a.muted = true;
    a.volume = 0;
    const p = a.play();
    if (p && typeof p.then === 'function') {
      p.then(() => { a.pause(); a.currentTime = 0; }).catch(() => {});
    }
  } catch (e) {}
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeToPush() {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  const token = localStorage.getItem('token');
  if (!token) return;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    const vapidRes = await fetch(`${apiUrl}/api/push/vapid-public-key`, { headers: { 'Authorization': 'Bearer ' + token } });
    if (!vapidRes.ok) return;
    const { publicKey } = await vapidRes.json();
    if (!publicKey) return;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
    const sub = subscription.toJSON();
    await fetch(`${apiUrl}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ endpoint: sub.endpoint, keys: sub.keys })
    });
  } catch (e) {}
}

export default function GlobalAlerts() {
  const [activeAlert, setActiveAlert] = useState<any>(null);
  const [msgToasts, setMsgToasts] = useState<any[]>([]);
  const [permission, setPermission] = useState('granted');
  const msgAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Registrar Service Worker y suscribirse a push (al montar y al iniciar sesión)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const trySubscribe = () => subscribeToPush();
    trySubscribe();
    window.addEventListener('crm-login', trySubscribe);
    return () => window.removeEventListener('crm-login', trySubscribe);
  }, []);

  // Desbloquear audio en la PRIMERA interacción (clave para que suene siempre después).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const events = ['pointerdown', 'keydown', 'touchstart', 'click'];
    events.forEach(ev => window.addEventListener(ev, unlockAudio, { once: true, passive: true }));
    return () => events.forEach(ev => window.removeEventListener(ev, unlockAudio));
  }, []);

  const requestPerm = async () => {
    if ('Notification' in window) {
      const p = await Notification.requestPermission();
      setPermission(p);
      if (p === 'granted') subscribeToPush();
    }
  };

  const playMessageSound = () => {
    try {
      if (!msgAudioRef.current) {
        msgAudioRef.current = new Audio();
        msgAudioRef.current.preload = 'auto';
      }
      const a = msgAudioRef.current;
      const url = localStorage.getItem('msgSound') || '/sounds/message.mp3';
      a.src = url;
      a.currentTime = 0;
      const p = a.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (e) {}
  };

  const openChat = (conversationId: string) => {
    try {
      window.focus();
      if (window.location.pathname === '/') {
        window.dispatchEvent(new CustomEvent('openChat', { detail: conversationId }));
      } else {
        window.location.href = '/?chat=' + encodeURIComponent(conversationId);
      }
    } catch (e) {}
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    let socket: any;

    if (token && userData) {
      const user = JSON.parse(userData);
      socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001', { auth: { token } });

      socket.on('new_message', (newMsg: any) => {
        const ctx = newMsg.conversationContext;
        if (!ctx || newMsg.senderType !== 'CLIENT') return;

        const canViewAll = user?.roleData?.canViewAllChats === true || user?.role?.name === 'SUPERADMIN' || user?.role === 'SUPERADMIN' || user?.role?.name === 'ADMIN' || user?.role === 'ADMIN';
        const myLineIds = user?.lines?.map((l: any) => l.id) || [];
        const isMine = ctx.assignedUserId === user?.id;
        const isUnassignedButInMyLine = !ctx.assignedUserId && myLineIds.includes(ctx.whatsappLineId);
        const isLegacy = !ctx.assignedUserId && !ctx.whatsappLineId;
        if (!canViewAll && !isMine && !isUnassignedButInMyLine && !isLegacy) return;

        const contactName = newMsg.contactName || newMsg.phoneNumber || 'Desconocido';
        const preview = newMsg.content?.substring(0, 50) || '📷 Archivo adjunto';
        const conversationId = newMsg.conversationId;

        // 1) Sonido de notificación (suena siempre una vez desbloqueado)
        playMessageSound();

        // 2) Toast interno en cualquier pantalla de la app
        const newToast = { id: Date.now() + Math.random(), name: contactName, text: preview, conversationId };
        setMsgToasts(prev => [...prev.slice(-4), newToast]);
        setTimeout(() => setMsgToasts(prev => prev.filter(t => t.id !== newToast.id)), 6000);

        // 3) Notificación nativa del navegador solo si la pestaña NO está enfocada
        if (!document.hasFocus()) {
          document.title = `(1) ${contactName} — Horustech CRM`;
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              const notif = new Notification(`Mensaje de ${contactName}`, {
                body: preview,
                icon: '/logo-icon.png',
                tag: conversationId,
              });
              notif.onclick = () => openChat(conversationId);
            } catch (e) {}
          }
        }
      });
    }

    const onFocus = () => { document.title = 'Horustech CRM'; };
    window.addEventListener('focus', onFocus);

    return () => {
      if (socket) socket.disconnect();
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Recordatorios (igual que antes)
  useEffect(() => {
    const fetchRemindersAndCheck = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/reminders`, { headers: { 'Authorization': 'Bearer ' + token } });
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
          <span className="font-semibold text-sm">Clic aquí para activar las notificaciones de escritorio</span>
        </div>
      )}
      {activeAlert && (
        <div className="fixed bottom-4 right-4 z-[9999] animate-bounce">
          <div className="bg-red-600 text-white p-6 rounded-2xl shadow-2xl flex flex-col gap-3 w-80 border-4 border-red-400 relative">
            <button onClick={() => setActiveAlert(null)} className="absolute top-2 right-2 hover:bg-red-700 rounded-full p-1"><X size={20} /></button>
            <div className="flex items-center gap-3"><AlarmClock size={32} className="animate-pulse" /><h3 className="font-bold text-xl">¡RECORDATORIO!</h3></div>
            <p className="text-red-50">{activeAlert.notes}</p>
          </div>
        </div>
      )}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {msgToasts.map(toast => (
          <div key={toast.id} onClick={() => openChat(toast.conversationId)} className="pointer-events-auto bg-white cursor-pointer rounded-2xl shadow-2xl border p-4 w-80 flex gap-4 hover:bg-gray-50">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shrink-0"><span className="text-white font-bold text-xl">{toast.name.charAt(0).toUpperCase()}</span></div>
            <div className="flex flex-col flex-1 overflow-hidden justify-center"><span className="font-bold text-gray-900 truncate">{toast.name}</span><span className="text-sm text-gray-500 truncate">{toast.text}</span></div>
          </div>
        ))}
      </div>
    </>
  );
}