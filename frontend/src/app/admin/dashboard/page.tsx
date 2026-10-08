'use client';

import { useEffect, useState } from 'react';
import { Users, MessageSquare, FileText, AlarmClock, Package, BarChart3 } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      
      const [stRes, sRes] = await Promise.all([
          fetch(`${api}/api/stats/dashboard`, { headers: { 'Authorization': 'Bearer ' + token } }),
          fetch(`${api}/api/settings`, { headers: { 'Authorization': 'Bearer ' + token } })
      ]);
      
      if (stRes.ok) setStats(await stRes.json());
      if (sRes.ok) {
        const d = await sRes.json();
        setStages(d.pipelineStages || [
            { id: 'NUEVO_LEAD', name: 'Nuevo Lead' },
            { id: 'EN_NEGOCIACION', name: 'En Negociación' },
            { id: 'VENTA_GANADA', name: 'Venta Ganada' },
            { id: 'VENTA_PERDIDA', name: 'Venta Perdida' }
        ]);
      }
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><BarChart3 className="text-blue-600" /> Dashboard Principal</h1>
          <p className="text-gray-500 mt-1">Métricas generales del CRM en tiempo real.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${c.color}`}><c.icon size={24} /></div>
            <div>
              <div className="text-sm text-gray-500">{c.label}</div>
              <div className="text-2xl font-bold text-gray-800">{loading ? '-' : c.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Conversaciones por etapa</h3>
          <div className="grid grid-cols-2 gap-4">
            {stages.map(stage => (
              <div key={stage.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="text-sm text-gray-500">{stage.name}</div>
                <div className="text-2xl font-bold text-gray-800">{stats?.stageCounts?.[stage.id] || 0}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Métricas del Sistema</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-gray-600">Usuarios Activos</span>
              <span className="font-bold text-gray-800">{stats?.users ?? 0}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-gray-600">Plantillas Meta</span>
              <span className="font-bold text-gray-800">{stats?.metaTemplates ?? 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Snippets (Resp. Rápidas)</span>
              <span className="font-bold text-gray-800">{stats?.snippets ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}