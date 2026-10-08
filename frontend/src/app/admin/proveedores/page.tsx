
"use client";
import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Page() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [lineFilter, setLineFilter] = useState('ALL');
  const [form, setForm] = useState({ id: '', businessLine: 'SM', name: '' });

  useEffect(() => { fetchData(); }, [lineFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/helpdesk/providers?line=${lineFilter}`, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      if (res.ok) setData(await res.json());
    } catch(e) {}
    setLoading(false);
  };

  
  const [uploading, setUploading] = useState(false);
  
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([['Nombre']]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    XLSX.writeFile(wb, "plantilla.xlsx");
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    formData.append('type', 'providers');
    formData.append('line', lineFilter);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/helpdesk/upload-excel`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Carga exitosa! Se guardaron ${data.count} registros nuevos para la linea ${lineFilter}.`);
        fetchData();
      } else {
        alert('Error al subir el archivo.');
      }
    } catch(err) {
      alert('Error de conexión al subir el archivo.');
    }
    setUploading(false);
    e.target.value = '';
  };
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = form.id ? `/api/helpdesk/providers/${form.id}` : '/api/helpdesk/providers';
      const method = form.id ? 'PUT' : 'POST';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}${url}`, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setShowModal(false);
        fetchData();
      }
    } catch(e) {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar registro?')) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/helpdesk/providers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      fetchData();
    } catch(e) {}
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Catálogo de Proveedores</h1>
          <select className="border rounded-lg px-3 py-1 bg-white dark:bg-[#202c33]" value={lineFilter} onChange={e => setLineFilter(e.target.value)}>
            <option value="ALL">Todas las Líneas</option>
            <option value="SM">Horustech (SM)</option>
            <option value="3D">3D SB</option>
          </select>
        </div>
        
        <div className="flex gap-2">
          
          <button onClick={handleDownloadTemplate} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold flex items-center gap-2 text-sm">
            Descargar Plantilla
          </button>
          <label className={`px-4 py-2 ${uploading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg cursor-pointer flex items-center gap-2 text-sm`}>
            {uploading ? 'Cargando...' : 'Carga Masiva (Excel)'}
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
          <button onClick={() => { setForm({ id: '', businessLine: 'SM', name: '' }); setShowModal(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Plus size={18} /> Nuevo
          </button>
        </div>

      </div>

      <div className="bg-white dark:bg-[#111b21] rounded-xl shadow-sm border border-gray-100 dark:border-[#202c33] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-gray-50 dark:bg-[#202c33] border-b border-gray-100 dark:border-[#374248]">
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Línea</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Nombre / Detalle</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#202c33]">
            {loading ? <tr><td colSpan={3} className="p-8 text-center">Cargando...</td></tr> : data.length === 0 ? <tr><td colSpan={3} className="p-8 text-center">No hay registros</td></tr> : data.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-[#202c33]">
                <td className="p-4 font-bold">{p.businessLine === '3D' ? '3D SB' : 'HORUSTECH'}</td>
                <td className="p-4">{p.name}</td>
                <td className="p-4 flex justify-end gap-2">
                  <button onClick={() => { setForm(p); setShowModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={18}/></button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#111b21] rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-[#202c33] flex justify-between items-center">
              <h2 className="text-xl font-bold">{form.id ? 'Editar' : 'Nuevo'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:bg-gray-100 rounded-lg p-2">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Línea</label>
                  <select value={form.businessLine} onChange={e => setForm({...form, businessLine: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33]">
                    <option value="SM">Horustech (SM)</option>
                    <option value="3D">3D SB</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre / Detalle</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33]" required />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
