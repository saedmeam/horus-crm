'use client';

import { useEffect, useState } from 'react';
import { Download, FileText, Search, Calendar, Package } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PedidosAdminPage() {
  const [backorders, setBackorders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBackorders();
  }, []);

  const fetchBackorders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/backorders`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        setBackorders(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = backorders.filter(b => 
    b.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.contact?.phone?.includes(searchTerm)
  );

  const exportExcel = () => {
    const data = filtered.map(b => ({
      'Fecha': new Date(b.createdAt).toLocaleDateString(),
      'Cliente': b.contact?.name || 'Desconocido',
      'Teléfono': b.contact?.phone || '',
      'Producto': b.productName,
      'Cantidad': b.quantity,
      'Categoría': b.category || '',
      'Especificación': b.specification || '',
      'Notas': b.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos");
    XLSX.writeFile(wb, `Pedidos_Horustech_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Reporte de Pedidos (Backorders) - Horustech", 14, 15);
    
    const tableColumn = ["Fecha", "Cliente", "Producto", "Cant.", "Categoría", "Notas"];
    const tableRows = filtered.map(b => [
      new Date(b.createdAt).toLocaleDateString(),
      b.contact?.name || b.contact?.phone || 'Desconocido',
      b.productName,
      b.quantity.toString(),
      b.category || '-',
      b.notes || '-'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      styles: { fontSize: 8 }
    });

    doc.save(`Pedidos_Horustech_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="text-blue-600" />
            Reporte de Pedidos (Backorders)
          </h1>
          <p className="text-gray-500 mt-1">Exporta la demanda no satisfecha para planificar importaciones.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
          >
            <Download size={18} /> Excel
          </button>
          <button 
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
          >
            <FileText size={18} /> PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por producto, cliente o teléfono..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Cantidad</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">Cargando pedidos...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">No se encontraron pedidos.</td></tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{b.contact?.name || 'Sin nombre'}</div>
                      <div className="text-xs text-gray-500">{b.contact?.phone}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-blue-700">{b.productName}</td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-bold">
                        x{b.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4">{b.category || '-'}</td>
                    <td className="px-6 py-4 text-xs max-w-xs truncate">{b.notes || '-'}</td>
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
