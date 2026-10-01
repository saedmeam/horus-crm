'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function CustomAlert() {
  const [alerts, setAlerts] = useState<{ id: number, message: string, type: 'success' | 'error' | 'info' }[]>([]);

  useEffect(() => {
    const handleAlert = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newAlert = {
        id: Date.now(),
        message: customEvent.detail.message,
        type: customEvent.detail.type || 'info'
      };
      
      setAlerts(prev => [...prev, newAlert]);

      setTimeout(() => {
        setAlerts(prev => prev.filter(a => a.id !== newAlert.id));
      }, 4000);
    };

    window.addEventListener('app-alert', handleAlert);
    return () => window.removeEventListener('app-alert', handleAlert);
  }, []);

  const removeAlert = (id: number) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full">
      {alerts.map(alert => {
        let bgClass = 'bg-blue-50 border-blue-200 text-blue-800';
        if (alert.type === 'success') bgClass = 'bg-green-50 border-green-200 text-green-800';
        if (alert.type === 'error') bgClass = 'bg-red-50 border-red-200 text-red-800';

        return (
          <div 
            key={alert.id} 
            className={"animate-fade-in-down flex items-start p-4 rounded-xl shadow-lg border " + bgClass}
          >
            <div className="shrink-0 mr-3 mt-0.5">
              {alert.type === 'success' && <CheckCircle size={20} className="text-green-600" />}
              {alert.type === 'error' && <AlertTriangle size={20} className="text-red-600" />}
              {alert.type === 'info' && <Info size={20} className="text-blue-600" />}
            </div>
            <div className="flex-1 text-sm font-medium">
              {alert.message}
            </div>
            <button 
              onClick={() => removeAlert(alert.id)} 
              className="shrink-0 ml-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
