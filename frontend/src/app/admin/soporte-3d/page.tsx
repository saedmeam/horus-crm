"use client";
import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
const auth = () => ({ 'Authorization': 'Bearer ' + localStorage.getItem('token') });

export default function Page() {
  const [data, setData] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ id: '', code: '', fecha: '', clienteId: '', equipoId: '', servicioId: '', asesor: '', compromiso: '' });

  useEffect(() => { fetchData(); fetchCatalogs(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/orders-3d`, { headers: auth() });
      if (res.ok) setData(await res.json());
    } catch (e) {}
    setLoading(false);
  };

  const fetchCatalogs = async () => {
    try {
      const [c, e, s] = await Promise.all([
        fetch(`${API}/api/helpdesk/clients?line=3D`, { headers: auth() }),
        fetch(`${API}/api/helpdesk/equipments?line=3D`, { headers: auth() }),
        fetch(`${API}/api/helpdesk/services?line=3D`, { headers: auth() })
      ]);
      if (c.ok) setClients(await c.json());
      if (e.ok) setEquipments(await e.json());
      if (s.ok) setServices(await s.json());
    } catch (e) {}
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = form.id ? `/api/orders-3d/${form.id}` : '/api/orders-3d';
    const res = await fetch(`${API}${url}`, {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify(form)
    });
    if (res.ok) { setShowModal(false); fetchData(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar orden 3D y sus órdenes de compra?')) return;
    await fetch(`${API}/api/orders-3d/${id}`, { method: 'DELETE', headers: auth() });
    fetchData();
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([['codigo', 'fecha', 'cliente', 'equipo', 'servicio', 'asesor', 'compromiso']]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '3d');
    XLSX.writeFile(wb, 'plantilla_soporte_3d.xlsx');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', e.target.files[0]);
    fd.append('type', 'orders-3d');
    try {
      const res = await fetch(`${API}/api/helpdesk/upload-excel`, { method: 'POST', headers: auth(), body: fd });
      if (res.ok) { const d = await res.json(); alert(`Carga exitosa! ${d.count} registros nuevos.`); fetchData(); }
      else alert('Error al subir el archivo.');
    } catch (err) { alert('Error de conexión al subir el archivo.'); }
    setUploading(false);
    e.target.value = '';
  };

  const inputCls = 'w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33] text-gray-900 dark:text-white';

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Soporte 3D</h1>
          <p className="text-sm text-gray-500">Órdenes de soporte de la línea 3D.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDownloadTemplate} className="px-3 py-2 border rounded-lg flex items-center gap-1 text-sm text-gray-700 dark:text-gray-200"><Download size={16}/> Plantilla</button>
          <label className={`px-3 py-2 rounded-lg flex items-center gap-1 text-sm cursor-pointer text-white ${uploading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}>
            <Upload size={16}/> {uploading ? 'Subiendo...' : 'Importar Excel'}
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} />
          </label>
          <button onClick={() => { setForm({ id: '', code: '', fecha: '', clienteId: '', equipoId: '', servicioId: '', asesor: '', compromiso: '' }); setShowModal(true); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1"><Plus size={18}/> Nuevo</button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111b21] rounded-xl shadow-sm border border-gray-100 dark:border-[#202c33] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-gray-50 dark:bg-[#202c33] border-b border-gray-100 dark:border-[#374248]">
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Código</th>

              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Equipo</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Servicio</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Asesor</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#202c33]">
            {loading ? <tr><td colSpan={7} className="p-8 text-center">Cargando...</td></tr> : data.length === 0 ? <tr><td colSpan={7} className="p-8 text-center">No hay registros</td></tr> : data.map(o => (
              <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-[#202c33]">
                <td className="p-4">{o.code || '—'}</td>
                <td className="p-4">{o.fecha ? new Date(o.fecha).toLocaleDateString() : '—'}</td>
                <td className="p-4">{o.cliente?.name || '—'}</td>
                <td className="p-4">{o.equipo?.name || '—'}</td>
                <td className="p-4">{o.servicio?.type || '—'}</td>
                <td className="p-4">{o.asesor || '—'}</td>
                <td className="p-4 flex justify-end gap-2">
                  <button onClick={() => { setForm(o); setShowModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={18}/></button>
                  <button onClick={() => handleDelete(o.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#111b21] rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-[#202c33] flex justify-between items-center">
              <h2 className="text-xl font-bold">{form.id ? 'Editar' : 'Nueva'} Orden 3D</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:bg-gray-100 rounded-lg p-2">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Código</label>
                <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className={inputCls} placeholder="Ej: 3D-0001" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Fecha</label>
                <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Cliente</label>
                <select value={form.clienteId} onChange={e => setForm({ ...form, clienteId: e.target.value })} className={inputCls}>
                  <option value="">Seleccione...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Equipo</label>
                <select value={form.equipoId} onChange={e => setForm({ ...form, equipoId: e.target.value })} className={inputCls}>
                  <option value="">Seleccione...</option>
                  {equipments.map(c => <option key={c.id} value={c.id}>{c.name} {c.brand ? `(${c.brand})` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Servicio</label>
                <select value={form.servicioId} onChange={e => setForm({ ...form, servicioId: e.target.value })} className={inputCls}>
                  <option value="">Seleccione...</option>
                  {services.map(c => <option key={c.id} value={c.id}>{c.type} - {c.description}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Asesor</label>
                <input value={form.asesor} onChange={e => setForm({ ...form, asesor: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Compromiso (imagen/URL)</label>
                <input value={form.compromiso} onChange={e => setForm({ ...form, compromiso: e.target.value })} className={inputCls} placeholder="URL de la imagen" />
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
