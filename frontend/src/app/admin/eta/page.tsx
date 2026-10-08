"use client";
import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import Pagination from '@/components/Pagination';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
const auth = () => ({ 'Authorization': 'Bearer ' + localStorage.getItem('token') });

export default function Page() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'todos'>(10);
  const paginatedData = pageSize === 'todos' ? data : data.slice((page - 1) * pageSize, page * pageSize);

  const [lineFilter, setLineFilter] = useState('ALL');
  const [form, setForm] = useState({ id: '', businessLine: 'SM', code: '', type: '', description: '', service: '' });

  useEffect(() => { setPage(1); fetchData(); }, [lineFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/helpdesk/eta-types?line=${lineFilter}`, { headers: auth() });
      if (res.ok) setData(await res.json());
    } catch (e) {}
    setLoading(false);
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([['Id Tipo ETA', 'Tipo', 'Descripcion', 'Servicio']]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    XLSX.writeFile(wb, "plantilla_eta.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', e.target.files[0]);
    fd.append('type', 'eta-types');
    fd.append('line', lineFilter);
    try {
      const res = await fetch(`${API}/api/helpdesk/upload-excel`, { method: 'POST', headers: auth(), body: fd });
      if (res.ok) { const d = await res.json(); alert(`Carga exitosa! ${d.count} registros nuevos.`); fetchData(); }
      else alert('Error al subir el archivo.');
    } catch (err) { alert('Error de conexión al subir el archivo.'); }
    setUploading(false);
    e.target.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = form.id ? `/api/helpdesk/eta-types/${form.id}` : '/api/helpdesk/eta-types';
    const res = await fetch(`${API}${url}`, {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify(form)
    });
    if (res.ok) { setShowModal(false); fetchData(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar registro?')) return;
    await fetch(`${API}/api/helpdesk/eta-types/${id}`, { method: 'DELETE', headers: auth() });
    fetchData();
  };

  const inputCls = 'w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33] text-gray-900 dark:text-white';
  const lineLabel = (l: string) => l === '3D' ? '3D SB' : 'HORUSTECH';

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tipos de ETA</h1>
          <p className="text-sm text-gray-500">Catálogo de tipos de ETA (3D y SM).</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={lineFilter} onChange={e => setLineFilter(e.target.value)} className="border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33] text-sm">
            <option value="ALL">Todas las líneas</option>
            <option value="SM">HORUSTECH (SM)</option>
            <option value="3D">3D SB</option>
          </select>
          <button onClick={handleDownloadTemplate} className="px-3 py-2 border rounded-lg flex items-center gap-1 text-sm text-gray-700 dark:text-gray-200"><Download size={16}/> Plantilla</button>
          <label className={`px-3 py-2 rounded-lg flex items-center gap-1 text-sm cursor-pointer text-white ${uploading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}>
            <Upload size={16}/> {uploading ? 'Subiendo...' : 'Importar Excel'}
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} />
          </label>
          <button onClick={() => { setForm({ id: '', businessLine: 'SM', code: '', type: '', description: '', service: '' }); setShowModal(true); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1"><Plus size={18}/> Nuevo</button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111b21] rounded-xl shadow-sm border border-gray-100 dark:border-[#202c33] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-gray-50 dark:bg-[#202c33] border-b border-gray-100 dark:border-[#374248]">
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Línea</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Código</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Descripción</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Servicio</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#202c33]">
            {loading ? <tr><td colSpan={6} className="p-8 text-center">Cargando...</td></tr> : data.length === 0 ? <tr><td colSpan={6} className="p-8 text-center">No hay registros</td></tr> : paginatedData.map(s => (
              <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-[#202c33]">
                <td className="p-4 font-bold">{lineLabel(s.businessLine)}</td>
                <td className="p-4 font-mono text-sm">{s.code || '—'}</td>
                <td className="p-4">{s.type || '—'}</td>
                <td className="p-4">{s.description || '—'}</td>
                <td className="p-4">{s.service || '—'}</td>
                <td className="p-4 flex justify-end gap-2">
                  <button onClick={() => { setForm(s); setShowModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={18}/></button>
                  <button onClick={() => handleDelete(s.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      <Pagination total={data.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#111b21] rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-[#202c33] flex justify-between items-center">
              <h2 className="text-xl font-bold">{form.id ? 'Editar' : 'Nuevo'} Tipo ETA</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:bg-gray-100 rounded-lg p-2">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Línea</label>
                  <select value={form.businessLine} onChange={e => setForm({ ...form, businessLine: e.target.value })} className={inputCls}>
                    <option value="SM">HORUSTECH (SM)</option>
                    <option value="3D">3D SB</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Id Tipo ETA</label>
                  <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Tipo</label>
                <input value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Descripción</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputCls} rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Servicio</label>
                <input value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} className={inputCls} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-gray-700 dark:text-gray-200">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
