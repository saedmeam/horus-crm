
"use client";
import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import Pagination from '@/components/Pagination';

export default function Page() {
  const [data, setData] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [lineFilter, setLineFilter] = useState('ALL');
  const [form, setForm] = useState({ id: '', businessLine: 'SM', code: '', name: '', brand: '', model: '', serial: '', clientId: '', modality: '', date: '', installDate: '', warrantyEndDate: '', contractStartDate: '', contractEndDate: '' });

  useEffect(() => { 
    setPage(1);
    fetchData(); 
    fetchClients();
  }, [lineFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/helpdesk/equipments?line=${lineFilter}`, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      if (res.ok) setData(await res.json());
    } catch(e) {}
    setLoading(false);
  };

  const fetchClients = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/helpdesk/clients?line=${lineFilter}`, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      if (res.ok) setClients(await res.json());
    } catch(e) {}
  };

  
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'todos'>(10);
  const paginatedData = pageSize === 'todos' ? data : data.slice((page - 1) * pageSize, page * pageSize);

  
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([['Equipo_Sistema', 'Marca', 'Modelo', 'Serie', 'Cedula_Cliente']]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    XLSX.writeFile(wb, "plantilla.xlsx");
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    formData.append('type', 'equipments');
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
      const url = form.id ? `/api/helpdesk/equipments/${form.id}` : '/api/helpdesk/equipments';
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
    if (!confirm('Eliminar equipo?')) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/helpdesk/equipments/${id}`, {
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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Catálogo de Equipos</h1>
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
          <button onClick={() => { setForm({ id: '', businessLine: 'SM', name: '', brand: '', model: '', serial: '', clientId: '' }); setShowModal(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Plus size={18} /> Nuevo
          </button>
        </div>

      </div>

      <div className="bg-white dark:bg-[#111b21] rounded-xl shadow-sm border border-gray-100 dark:border-[#202c33] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-gray-50 dark:bg-[#202c33] border-b border-gray-100 dark:border-[#374248]">
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Línea</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Cliente Asignado</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Equipo</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Marca / Modelo</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Serie</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#202c33]">
            {loading ? <tr><td colSpan={6} className="p-8 text-center">Cargando...</td></tr> : data.length === 0 ? <tr><td colSpan={6} className="p-8 text-center">No hay equipos</td></tr> : paginatedData.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-[#202c33]">
                <td className="p-4 font-bold">{p.businessLine === '3D' ? '3D SB' : 'HORUSTECH'}</td>
                <td className="p-4 text-blue-600 font-medium">{p.client?.name || p.clientId || 'Sin Asignar'}</td>
                <td className="p-4">{p.name}</td>
                <td className="p-4">{p.brand || '-'} / {p.model || '-'}</td>
                <td className="p-4">{p.serial || '-'}</td>
                <td className="p-4 flex justify-end gap-2">
                  <button onClick={() => { setForm({id: p.id, businessLine: p.businessLine, name: p.name, brand: p.brand||'', model: p.model||'', serial: p.serial||'', clientId: p.clientId||''}); setShowModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={18}/></button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      <Pagination total={data.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#111b21] rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-[#202c33] flex justify-between items-center">
              <h2 className="text-xl font-bold">{form.id ? 'Editar' : 'Nuevo'} Equipo</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:bg-gray-100 rounded-lg p-2">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">Línea</label>
                  <select value={form.businessLine} onChange={e => setForm({...form, businessLine: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33]">
                    <option value="SM">Horustech (SM)</option>
                    <option value="3D">3D SB</option>
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">Cliente (Opcional)</label>
                  <select value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33]">
                    <option value="">Seleccione un cliente...</option>
                    {clients.filter(c => c.businessLine === form.businessLine).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">Nombre Equipo / Sistema</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33]" required />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">Marca</label>
                  <input value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33]" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">Modelo</label>
                  <input value={form.model} onChange={e => setForm({...form, model: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33]" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">Serie</label>
                  <input value={form.serial} onChange={e => setForm({...form, serial: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33]" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">ID Equipo</label>
                  <input value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33]" placeholder="IDE3D0001" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">Fecha de instalación</label>
                  <input type="date" value={form.installDate} onChange={e => setForm({...form, installDate: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33]" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">Fin de garantía</label>
                  <input type="date" value={form.warrantyEndDate} onChange={e => setForm({...form, warrantyEndDate: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33]" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">Inicio de contrato</label>
                  <input type="date" value={form.contractStartDate} onChange={e => setForm({...form, contractStartDate: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33]" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">Fin de contrato</label>
                  <input type="date" value={form.contractEndDate} onChange={e => setForm({...form, contractEndDate: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33]" />
                </div>
                {form.businessLine === 'SM' && (
                  <>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium mb-1">Modalidad</label>
                      <input value={form.modality} onChange={e => setForm({...form, modality: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33]" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium mb-1">Fecha</label>
                      <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33]" />
                    </div>
                  </>
                )}
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
