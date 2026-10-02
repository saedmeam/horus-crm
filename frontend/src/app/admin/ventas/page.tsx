'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, TrendingUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const STAGE_ORDER = ['NUEVO_LEAD', 'EN_NEGOCIACION', 'VENTA_GANADA', 'VENTA_PERDIDA'];
const STAGE_LABELS: Record<string, string> = { 'NUEVO_LEAD': 'Nuevo Lead', 'EN_NEGOCIACION': 'En Negociación', 'VENTA_GANADA': 'Venta Ganada', 'VENTA_PERDIDA': 'Venta Perdida' };
const STAGE_COLORS: Record<string, string> = { 'NUEVO_LEAD': 'bg-blue-100 text-blue-800', 'EN_NEGOCIACION': 'bg-yellow-100 text-yellow-800', 'VENTA_GANADA': 'bg-green-100 text-green-800', 'VENTA_PERDIDA': 'bg-red-100 text-red-800' };

export default function VentasAdminPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchConversations(); }, []);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/conversations`, { headers: { 'Authorization': 'Bearer ' + token } });
      if (res.ok) { const data = await res.json(); setConversations(Array.isArray(data) ? data : []); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const stageGroups = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const c of conversations) { const s = c.stage || 'NUEVO_LEAD'; if (!map[s]) map[s] = []; map[s].push(c); }
    return map;
  }, [conversations]);

  const sortedStages = useMemo(() => {
    const known = STAGE_ORDER.filter(s => stageGroups[s]);
    const others = Object.keys(stageGroups).filter(s => !STAGE_ORDER.includes(s));
    return [...known, ...others];
  }, [stageGroups]);

  const total = conversations.length;

  const exportExcel = () => {
    const data = conversations.map(c => ({ 'Cliente': c.contact?.name || 'Sin nombre', 'Teléfono': c.contact?.phone || '', 'Etapa': STAGE_LABELS[c.stage] || c.stage, 'Estado': c.status || '', 'Última actividad': new Date(c.updatedAt).toLocaleDateString() }));
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
    XLSX.writeFile(wb, `Ventas_Horustech_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF(); doc.text('Reporte de Ventas (Embudo) - Horustech', 14, 15);
    const tableColumn = ['Cliente', 'Teléfono', 'Etapa', 'Estado', 'Última actividad'];
    const tableRows = conversations.map(c => [ c.contact?.name || 'Sin nombre', c.contact?.phone || '-', STAGE_LABELS[c.stage] || c.stage, c.status || '-', new Date(c.updatedAt).toLocaleDateString() ]);
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
        {sortedStages.map(stage => (
          <div key={stage} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-sm font-semibold text-gray-500">{STAGE_LABELS[stage] || stage}</div>
            <div className="text-3xl font-bold text-gray-800 mt-1">{stageGroups[stage]?.length || 0}</div>
          </div>
        ))}
        {sortedStages.length === 0 && !loading && (
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
                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded-md text-xs font-bold ${STAGE_COLORS[c.stage] || 'bg-gray-100 text-gray-800'}`}>{STAGE_LABELS[c.stage] || c.stage}</span></td>
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