"use client";
import { useEffect, useState } from 'react';
import { AlarmClock, X } from 'lucide-react';

export default function GlobalAlerts() {
  const [activeAlert, setActiveAlert] = useState<any>(null);

  useEffect(() => {
    const fetchRemindersAndCheck = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch('http://localhost:3001/api/reminders', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.ok) {
          const reminders = await res.json();
          const now = new Date();
          const due = reminders.find((r: any) => {
            if (r.isCompleted) return false;
            const rDate = new Date(r.scheduledFor);
            return rDate <= now && !localStorage.getItem('alerted_' + r.id);
          });
          
          if (due) {
            localStorage.setItem('alerted_' + due.id, 'true');
            setActiveAlert(due);
            const audio = new Audio(localStorage.getItem('alarmSound') || '/sounds/reminder.mp3');
            audio.play().catch(e => console.log('Autoplay bloqueado:', e));
          }
        }
      } catch (err) {}
    };

    const interval = setInterval(fetchRemindersAndCheck, 10000); // Check every 10 seconds globally
    return () => clearInterval(interval);
  }, []);

  if (!activeAlert) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-bounce">
      <div className="bg-red-600 text-white p-6 rounded-2xl shadow-2xl flex flex-col gap-3 w-80 relative border-4 border-red-400">
        <button onClick={() => setActiveAlert(null)} className="absolute top-2 right-2 hover:bg-red-700 rounded-full p-1 transition-colors">
          <X size={20} />
        </button>
        <div className="flex items-center gap-3">
          <AlarmClock size={32} className="animate-pulse" />
          <h3 className="font-bold text-xl">¡RECORDATORIO!</h3>
        </div>
        <p className="text-red-50">{activeAlert.notes}</p>
        {activeAlert.contact && (
          <div className="bg-red-800 bg-opacity-40 p-3 rounded-lg mt-2">
            <p className="font-semibold">{activeAlert.contact.name}</p>
            <p className="text-sm opacity-90">{activeAlert.contact.phone}</p>
          </div>
        )}
      </div>
    </div>
  );
}
