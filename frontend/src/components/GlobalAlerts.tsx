'use client';

import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import io from 'socket.io-client';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  const token = localStorage.getItem('token');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    const vapidRes = await fetch(`${apiUrl}/api/push/vapid-public-key`, { headers: { 'Authorization': 'Bearer ' + token } });
    if (!vapidRes.ok) {
      if (vapidRes.status === 401 || vapidRes.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return;
    }
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
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      if (Notification.permission === 'granted') {
        subscribeToPush();
      }
    }
  }, []);

  const requestPerm = async () => {
    if (!('Notification' in window)) return;
    const p = await Notification.requestPermission();
    setPermission(p);
    if (p === 'granted') {
      subscribeToPush();
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
    const newSocket = io(apiUrl, { auth: { token } });
    setSocket(newSocket);

    newSocket.on('connect_error', (err) => {
      if (err.message.includes('No autorizado')) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    });

    newSocket.on('new_message_alert', (data: any) => {
      // Ignorar si el usuario ya está en ese chat
      if (window.location.pathname === '/' || window.location.pathname === '/kanban') {
        // En esas pantallas se maneja por su propio contexto o socket local
        // Pero para el Toast global en otras pantallas:
        if (Notification.permission === 'granted') {
          new Notification('Nuevo mensaje', {
            body: `${data.contactName}: ${data.content}`,
            icon: '/icon-192x192.png'
          });
        }
        
        // Agregar al toast
        const id = Date.now();
        setMsgToasts(prev => [...prev, { id, ...data }]);
        setTimeout(() => {
          setMsgToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Recordatorios (igual que antes)
  useEffect(() => {
    const fetchRemindersAndCheck = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/reminders`, { headers: { 'Authorization': 'Bearer ' + token } });
        
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }

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

            if (permission === 'granted') {
              new Notification('Recordatorio de Cliente', {
                body: `${due.contact.name} - ${due.notes}`,
                icon: '/icon-192x192.png'
              });
            }
          }
        }
      } catch (err) {}
    };
    const interval = setInterval(fetchRemindersAndCheck, 10000);
    return () => clearInterval(interval);
  }, [permission]);

  return (
    <>
      {permission === 'default' && (
        <div onClick={requestPerm} className="fixed top-0 left-0 right-0 bg-blue-600 text-white p-3 z-[10000] flex justify-center items-center gap-3 cursor-pointer shadow-md hover:bg-blue-700 transition-all">
          <Bell size={20} className="animate-bounce" />
          <span className="font-semibold text-sm">Clic aquí para activar las notificaciones de escritorio</span>
        </div>
      )}

      {/* Alerta de recordatorio */}
      {activeAlert && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-[#202c33] text-gray-800 dark:text-gray-100 p-4 rounded-xl shadow-2xl border border-blue-500 z-[9999] animate-bounce w-80">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-500 text-white p-2 rounded-full">
              <Bell size={20} />
            </div>
            <h3 className="font-bold text-lg">¡Recordatorio!</h3>
          </div>
          <p className="font-semibold text-blue-600 dark:text-blue-400">{activeAlert.contact.name}</p>
          <p className="text-sm mt-1 mb-3">{activeAlert.notes}</p>
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => setActiveAlert(null)}
              className="px-3 py-1 bg-gray-200 dark:bg-[#374248] text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm"
            >
              Cerrar
            </button>
            <button 
              onClick={() => {
                window.location.href = '/?chatId=' + activeAlert.contactId;
              }}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
            >
              Ir al chat
            </button>
          </div>
        </div>
      )}

      {/* Toasts de mensajes entrantes (global) */}
      <div className="fixed bottom-4 left-4 z-[9999] flex flex-col gap-2">
        {msgToasts.map(t => (
          <div key={t.id} className="bg-green-600 text-white p-3 rounded-lg shadow-lg flex items-start justify-between min-w-[250px] animate-fade-in-up">
            <div>
              <p className="font-bold text-sm">{t.contactName}</p>
              <p className="text-xs mt-1 truncate max-w-[200px]">{t.content}</p>
            </div>
            <button onClick={() => setMsgToasts(prev => prev.filter(x => x.id !== t.id))} className="text-white/80 hover:text-white">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}