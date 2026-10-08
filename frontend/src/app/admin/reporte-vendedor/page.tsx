'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReporteVendedorPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
    try {
      const [aRes, cRes, sRes] = await Promise.all([
        fetch(`${api}/api/users/agents`, { headers: { 'Authorization': 'Bearer ' + token } }),
        fetch(`${api}/api/conversations`, { headers: { 'Authorization': 'Bearer ' + token } }),
        fetch(`${api}/api/settings`, { headers: { 'Authorization': 'Bearer ' + token } })
      ]);
      
      if (aRes.ok) setAgents(await aRes.json());
      if (cRes.ok) { const d = await cRes.json(); setConversations(Array.isArray(d) ? d : []); }
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

  const rows = useMemo(() => agents.map(a => {
    const own = conversations.filter(c => c.assignedUserId === a.id);
    const counts: Record<string, number> = {};
    for (const s of stages) counts[s.id] = own.filter(c => c.stage === s.id).length;
    return { id: a.id, name: a.name || a.username, username: a.username, total: own.length, counts };
  }), [agents, conversations, stages]);

  const unassigned = conversations.filter(c => !c.assignedUserId).length;

  const exportExcel = () => {
    const data = rows.map(r => {
        const row: any = { 'Vendedor': r.name, 'Usuario': r.username, 'Total': r.total };
        stages.forEach(s => { row[s.name] = r.counts[s.id]; });
        return row;
    });
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Vendedores');
    XLSX.writeFile(wb, `Vendedores_Horustech_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF(); doc.text('Reporte por Vendedor - Horustech', 14, 15);
    const head = ['Vendedor', 'Total', ...stages.map(s => s.name)];
    const body = rows.map(r => [r.name, String(r.total), ...stages.map(s => String(r.counts[s.id]))]);
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
              <tr>
                <th className="px-6 py-4">Vendedor</th>
                <th className="px-6 py-4">Total</th>
                {stages.map(s => (
                    <th key={s.id} className="px-6 py-4">{s.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={stages.length + 2} className="p-8 text-center text-gray-400">Cargando...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={stages.length + 2} className="p-8 text-center text-gray-400">No hay vendedores.</td></tr>
              ) : (
                rows.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{r.name}</td>
                    <td className="px-6 py-4 font-bold">{r.total}</td>
                    {stages.map(s => (
                        <td key={s.id} className="px-6 py-4">{r.counts[s.id]}</td>
                    ))}
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