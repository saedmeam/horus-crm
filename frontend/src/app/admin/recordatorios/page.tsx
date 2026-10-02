'use client';

import { useEffect, useState } from 'react';
import { Download, FileText, AlarmClock } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function RecordatoriosAdminPage() {
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReminders(); }, []);

  const fetchReminders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/reminders/all`, { headers: { 'Authorization': 'Bearer ' + token } });
      if (res.ok) setReminders(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const exportExcel = () => {
    const data = reminders.map(r => ({ 'Vendedor': r.user?.name || '-', 'Cliente': r.contact?.name || '-', 'Teléfono': r.contact?.phone || '', 'Fecha': new Date(r.scheduledFor).toLocaleString(), 'Notas': r.notes, 'Completado': r.isCompleted ? 'Sí' : 'No' }));
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Recordatorios');
    XLSX.writeFile(wb, `Recordatorios_Horustech_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF(); doc.text('Reporte de Recordatorios - Horustech', 14, 15);
    const head = ['Vendedor', 'Cliente', 'Teléfono', 'Fecha', 'Notas'];
    const body = reminders.map(r => [r.user?.name || '-', r.contact?.name || '-', r.contact?.phone || '', new Date(r.scheduledFor).toLocaleString(), r.notes || '-']);
    autoTable(doc, { head: [head], body, startY: 25, styles: { fontSize: 7 } });
    doc.save(`Recordatorios_Horustech_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><AlarmClock className="text-blue-600" /> Reporte de Recordatorios</h1>
          <p className="text-gray-500 mt-1">Seguimientos programados por todos los vendedores.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"><Download size={18} /> Excel</button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"><FileText size={18} /> PDF</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
              <tr><th className="px-6 py-4">Vendedor</th><th className="px-6 py-4">Cliente</th><th className="px-6 py-4">Fecha</th><th className="px-6 py-4">Notas</th><th className="px-6 py-4">Estado</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Cargando...</td></tr>
              ) : reminders.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No hay recordatorios.</td></tr>
              ) : (
                reminders.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{r.user?.name || '-'}</td>
                    <td className="px-6 py-4">{r.contact?.name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(r.scheduledFor).toLocaleString()}</td>
                    <td className="px-6 py-4 max-w-xs truncate">{r.notes || '-'}</td>
                    <td className="px-6 py-4">{r.isCompleted ? <span className="text-green-600">Completado</span> : <span className="text-amber-600">Pendiente</span>}</td>
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