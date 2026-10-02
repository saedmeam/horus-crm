'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const STAGES = ['NUEVO_LEAD', 'EN_NEGOCIACION', 'VENTA_GANADA', 'VENTA_PERDIDA'];
const STAGE_LABELS: Record<string, string> = { 'NUEVO_LEAD': 'Nuevo Lead', 'EN_NEGOCIACION': 'En Negociación', 'VENTA_GANADA': 'Venta Ganada', 'VENTA_PERDIDA': 'Venta Perdida' };

export default function ReporteVendedorPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
    try {
      const [aRes, cRes] = await Promise.all([
        fetch(`${api}/api/users/agents`, { headers: { 'Authorization': 'Bearer ' + token } }),
        fetch(`${api}/api/conversations`, { headers: { 'Authorization': 'Bearer ' + token } })
      ]);
      if (aRes.ok) setAgents(await aRes.json());
      if (cRes.ok) { const d = await cRes.json(); setConversations(Array.isArray(d) ? d : []); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const rows = useMemo(() => agents.map(a => {
    const own = conversations.filter(c => c.assignedUserId === a.id);
    const counts: Record<string, number> = {};
    for (const s of STAGES) counts[s] = own.filter(c => c.stage === s).length;
    return { id: a.id, name: a.name || a.username, username: a.username, total: own.length, counts };
  }), [agents, conversations]);

  const unassigned = conversations.filter(c => !c.assignedUserId).length;

  const exportExcel = () => {
    const data = rows.map(r => ({ 'Vendedor': r.name, 'Usuario': r.username, 'Total': r.total, 'Nuevo Lead': r.counts.NUEVO_LEAD, 'En Negociación': r.counts.EN_NEGOCIACION, 'Venta Ganada': r.counts.VENTA_GANADA, 'Venta Perdida': r.counts.VENTA_PERDIDA }));
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Vendedores');
    XLSX.writeFile(wb, `Vendedores_Horustech_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF(); doc.text('Reporte por Vendedor - Horustech', 14, 15);
    const head = ['Vendedor', 'Total', 'Nuevo Lead', 'En Negociación', 'Venta Ganada', 'Venta Perdida'];
    const body = rows.map(r => [r.name, String(r.total), String(r.counts.NUEVO_LEAD), String(r.counts.EN_NEGOCIACION), String(r.counts.VENTA_GANADA), String(r.counts.VENTA_PERDIDA)]);
    autoTable(doc, { head: [head], body, startY: 25, styles: { fontSize: 8 } });
    doc.save(`Vendedores_Horustech_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Users className="text-blue-600" /> Reporte por Vendedor</h1>
          <p className="text-gray-500 mt-1">Conversaciones asignadas y avance por etapa de cada vendedor.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"><Download size={18} /> Excel</button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"><FileText size={18} /> PDF</button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <p className="text-sm text-gray-500">Conversaciones sin asignar: <span className="font-bold text-gray-800">{unassigned}</span></p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
              <tr><th className="px-6 py-4">Vendedor</th><th className="px-6 py-4">Total</th><th className="px-6 py-4">Nuevo Lead</th><th className="px-6 py-4">En Negociación</th><th className="px-6 py-4">Venta Ganada</th><th className="px-6 py-4">Venta Perdida</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">Cargando...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">No hay vendedores.</td></tr>
              ) : (
                rows.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{r.name}</td>
                    <td className="px-6 py-4 font-bold">{r.total}</td>
                    <td className="px-6 py-4">{r.counts.NUEVO_LEAD}</td>
                    <td className="px-6 py-4">{r.counts.EN_NEGOCIACION}</td>
                    <td className="px-6 py-4 text-green-600 font-bold">{r.counts.VENTA_GANADA}</td>
                    <td className="px-6 py-4 text-red-600">{r.counts.VENTA_PERDIDA}</td>
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