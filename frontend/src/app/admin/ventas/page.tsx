'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, TrendingUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function VentasAdminPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      const [cRes, sRes] = await Promise.all([
        fetch(`${api}/api/conversations`, { headers: { 'Authorization': 'Bearer ' + token } }),
        fetch(`${api}/api/settings`, { headers: { 'Authorization': 'Bearer ' + token } })
      ]);
      
      if (cRes.ok) { const data = await cRes.json(); setConversations(Array.isArray(data) ? data : []); }
      if (sRes.ok) {
        const d = await sRes.json();
        setStages(d.pipelineStages || [
            { id: 'NUEVO_LEAD', name: 'Nuevo Lead', color: '#3b82f6' },
            { id: 'EN_NEGOCIACION', name: 'En Negociación', color: '#eab308' },
            { id: 'VENTA_GANADA', name: 'Venta Ganada', color: '#22c55e' },
            { id: 'VENTA_PERDIDA', name: 'Venta Perdida', color: '#ef4444' }
        ]);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const getStageName = (id: string) => {
    const s = stages.find(st => st.id === id);
    return s ? s.name : id;
  };

  const getStageColor = (id: string) => {
    const s = stages.find(st => st.id === id);
    return s?.color || '#9ca3af';
  };

  const stageGroups = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const c of conversations) { 
        const s = c.stage || (stages.length > 0 ? stages[0].id : 'NUEVO_LEAD'); 
        if (!map[s]) map[s] = []; 
        map[s].push(c); 
    }
    return map;
  }, [conversations, stages]);

  const sortedStageIds = useMemo(() => {
    const known = stages.map(s => s.id).filter(id => stageGroups[id]);
    const others = Object.keys(stageGroups).filter(id => !stages.find(s => s.id === id));
    return [...known, ...others];
  }, [stageGroups, stages]);

  const total = conversations.length;

  const exportExcel = () => {
    const data = conversations.map(c => ({ 'Cliente': c.contact?.name || 'Sin nombre', 'Teléfono': c.contact?.phone || '', 'Etapa': getStageName(c.stage), 'Estado': c.status || '', 'Última actividad': new Date(c.updatedAt).toLocaleDateString() }));
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
    XLSX.writeFile(wb, `Ventas_Horustech_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF(); doc.text('Reporte de Ventas (Embudo) - Horustech', 14, 15);
    const tableColumn = ['Cliente', 'Teléfono', 'Etapa', 'Estado', 'Última actividad'];
    const tableRows = conversations.map(c => [ c.contact?.name || 'Sin nombre', c.contact?.phone || '-', getStageName(c.stage), c.status || '-', new Date(c.updatedAt).toLocaleDateString() ]);
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 25, styles: { fontSize: 8 } });
    doc.save(`Ventas_Horustech_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><TrendingUp className="text-blue-600" /> Reporte de Ventas (Embudo)</h1>
          <p className="text-gray-500 mt-1">Resumen de conversaciones por etapa del embudo de ventas.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"><Download size={18} /> Excel</button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"><FileText size={18} /> PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sortedStageIds.map(stageId => (
          <div key={stageId} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-sm font-semibold text-gray-500" style={{ color: getStageColor(stageId) }}>{getStageName(stageId)}</div>
            <div className="text-3xl font-bold text-gray-800 mt-1">{stageGroups[stageId]?.length || 0}</div>
          </div>
        ))}
        {sortedStageIds.length === 0 && !loading && (
          <div className="col-span-4 bg-white p-6 rounded-2xl text-center text-gray-400">No hay conversaciones todavía.</div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100"><p className="text-sm text-gray-500">Total de conversaciones: <span className="font-bold text-gray-800">{total}</span></p></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
              <tr><th className="px-6 py-4">Cliente</th><th className="px-6 py-4">Teléfono</th><th className="px-6 py-4">Etapa</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4">Última actividad</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Cargando...</td></tr>
              ) : conversations.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No hay conversaciones.</td></tr>
              ) : (
                conversations.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{c.contact?.name || 'Sin nombre'}</td>
                    <td className="px-6 py-4">{c.contact?.phone || '-'}</td>
                    <td className="px-6 py-4">
                        <span 
                            className="px-2 py-1 rounded-md text-xs font-bold text-white" 
                            style={{ backgroundColor: getStageColor(c.stage) }}>
                            {getStageName(c.stage)}
                        </span>
                    </td>
                    <td className="px-6 py-4">{c.status || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(c.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}