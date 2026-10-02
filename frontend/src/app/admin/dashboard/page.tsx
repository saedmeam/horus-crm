'use client';

import { useEffect, useState } from 'react';
import { Users, MessageSquare, FileText, AlarmClock, Package, BarChart3 } from 'lucide-react';

const STAGE_LABELS: Record<string, string> = { 'NUEVO_LEAD': 'Nuevo Lead', 'EN_NEGOCIACION': 'En Negociación', 'VENTA_GANADA': 'Venta Ganada', 'VENTA_PERDIDA': 'Venta Perdida' };

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/stats/dashboard`, { headers: { 'Authorization': 'Bearer ' + token } });
      if (res.ok) setStats(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const cards = [
    { label: 'Contactos', value: stats?.contacts ?? 0, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Conversaciones', value: stats?.conversations ?? 0, icon: MessageSquare, color: 'text-green-600 bg-green-50' },
    { label: 'Mensajes', value: stats?.messages ?? 0, icon: FileText, color: 'text-purple-600 bg-purple-50' },
    { label: 'Recordatorios pendientes', value: stats?.pendingReminders ?? 0, icon: AlarmClock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Backorders', value: stats?.backorders ?? 0, icon: Package, color: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><BarChart3 size={32} /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 mt-1">Métricas generales del CRM.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.color}`}><c.icon size={22} /></div>
            <div className="text-2xl font-bold text-gray-800 mt-3">{c.value}</div>
            <div className="text-sm text-gray-500">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Conversaciones por etapa</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(STAGE_LABELS).map(([key, label]) => (
            <div key={key} className="bg-gray-50 p-4 rounded-xl">
              <div className="text-sm text-gray-500">{label}</div>
              <div className="text-2xl font-bold text-gray-800">{stats?.stageCounts?.[key] || 0}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}