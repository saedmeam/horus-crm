
"use client";
import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import Pagination from '@/components/Pagination';

export default function Page() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [lineFilter, setLineFilter] = useState('ALL');
  const [form, setForm] = useState({ id: '', businessLine: 'SM', code: '', cedula: '', company: '', name: '', lastNames: '', email: '', phone: '', city: '', address: '', lastServiceOrderDate: '', firstServiceOrderDate: '', clientStatus: '', incidentCount: '' });

  useEffect(() => { setPage(1); fetchData(); }, [lineFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/helpdesk/clients?line=${lineFilter}`, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      if (res.ok) setData(await res.json());
    } catch(e) {}
    setLoading(false);
  };

  
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'todos'>(10);
  const paginatedData = pageSize === 'todos' ? data : data.slice((page - 1) * pageSize, page * pageSize);

  
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([['Cedula', 'Empresa_Nombres', 'Apellidos']]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    XLSX.writeFile(wb, "plantilla.xlsx");
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    formData.append('type', 'clients');
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
      const url = form.id ? `/api/helpdesk/clients/${form.id}` : '/api/helpdesk/clients';
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
    if (!confirm('Eliminar cliente?')) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/helpdesk/clients/${id}`, {
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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Catálogo de Clientes</h1>
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
          <button onClick={() => { setForm({ id: '', businessLine: 'SM', name: '', cedula: '', lastNames: '', email: '', phone: '', city: '', address: '' }); setShowModal(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Plus size={18} /> Nuevo
          </button>
        </div>

      </div>

      <div className="bg-white dark:bg-[#111b21] rounded-xl shadow-sm border border-gray-100 dark:border-[#202c33] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-gray-50 dark:bg-[#202c33] border-b border-gray-100 dark:border-[#374248]">
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Línea</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Cédula</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Nombres / Empresa</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Correo</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Teléfono</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#202c33]">
            {loading ? <tr><td colSpan={6} className="p-8 text-center">Cargando...</td></tr> : data.length === 0 ? <tr><td colSpan={6} className="p-8 text-center">No hay clientes</td></tr> : paginatedData.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-[#202c33]">
                <td className="p-4 font-bold">{p.businessLine === '3D' ? '3D SB' : 'HORUSTECH'}</td>
                <td className="p-4">{p.cedula || '-'}</td>
                <td className="p-4">{p.name} {p.lastNames || ''}</td>
                <td className="p-4">{p.email || '-'}</td>
                <td className="p-4">{p.phone || '-'}</td>
                <td className="p-4 flex justify-end gap-2">
                  <button onClick={() => { setForm(p); setShowModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={18}/></button>
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
              <h2 className="text-xl font-bold">{form.id ? 'Editar' : 'Nuevo'} Cliente</h2>
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
                  <label className="block text-sm font-medium mb-1">Cédula</label>
                  <input value={form.cedula} onChange={e => setForm({...form, cedula: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33]" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">Empresa o Nombre</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33]" required />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">Apellidos (Opcional)</label>
                  <input value={form.lastNames} onChange={e => setForm({...form, lastNames: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33]" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">Correo</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33]" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">Teléfono</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33]" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">ID Cliente</label>
                  <input value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33]" placeholder="IDCLSM0001" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">Empresa / Institución</label>
                  <input value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33]" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">Ciudad</label>
                  <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33]" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">Dirección</label>
                  <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33]" />
                </div>
                {form.businessLine === 'SM' && (
                  <>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium mb-1">Fecha última OS</label>
                      <input type="date" value={form.lastServiceOrderDate} onChange={e => setForm({...form, lastServiceOrderDate: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33]" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium mb-1">Fecha primera OS</label>
                      <input type="date" value={form.firstServiceOrderDate} onChange={e => setForm({...form, firstServiceOrderDate: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33]" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium mb-1">Estado de Cliente</label>
                      <select value={form.clientStatus} onChange={e => setForm({...form, clientStatus: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33]">
                        <option value="">—</option>
                        <option value="Activo">Activo</option>
                        <option value="En riesgo">En riesgo</option>
                        <option value="Inactivo">Inactivo</option>
                      </select>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium mb-1">Incidencias creadas</label>
                      <input type="number" value={form.incidentCount} onChange={e => setForm({...form, incidentCount: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33]" />
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
