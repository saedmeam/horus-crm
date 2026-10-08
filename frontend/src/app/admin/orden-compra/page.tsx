"use client";
import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
const auth = () => ({ 'Authorization': 'Bearer ' + localStorage.getItem('token') });

const empty = { id: '', serviceOrderId: '', ordenNo: '', fecha: '', recepcion: '', observaciones: '', precio: '', abono: '', subtotal: '', nombreAsesor: '', estado: '', tarea: '', diagnosticoRealizado: '', tecnico: '', servicioRealizado: '', cobrado: '', entregado: '' };

export default function Page() {
  const [data, setData] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ ...empty });

  useEffect(() => { fetchData(); fetchOrders(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/purchase-orders`, { headers: auth() });
      if (res.ok) setData(await res.json());
    } catch (e) {}
    setLoading(false);
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API}/api/orders-3d`, { headers: auth() });
      if (res.ok) setOrders(await res.json());
    } catch (e) {}
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.serviceOrderId) { alert('Seleccione la orden 3D a la que pertenece'); return; }
    const url = form.id ? `/api/purchase-orders/${form.id}` : '/api/purchase-orders';
    const res = await fetch(`${API}${url}`, {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify(form)
    });
    if (res.ok) { setShowModal(false); fetchData(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar orden de compra?')) return;
    await fetch(`${API}/api/purchase-orders/${id}`, { method: 'DELETE', headers: auth() });
    fetchData();
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([[
      'OrdenNo', 'Fecha', 'Codigo 3d', 'CI_RUC', 'Recepcion', 'Observaciones', 'Precio', 'Abono', 'Subtotal',
      'Nombre Asesor', 'Firma Cliente', 'Revisado por', 'Generar PDF', 'Video', 'Estado', 'Tarea',
      'Descripción de Presupuesto', 'Presupuesto Aprobado', 'Precio Presupuesto', 'Tiempo de finalización de Incidencia',
      'Servicio Tipo', 'Asesor Tipo', 'Diagnostico Realizado', 'Tecnico', 'Realizado por', 'Vendedora que negocia',
      'Servicio realizado', 'Cobrado', 'Entregado', 'Cobrado por', 'Entregado por', 'Observacion de produccion', 'Observacion de Negociacion'
    ]]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'orden de compra');
    XLSX.writeFile(wb, 'plantilla_orden_compra.xlsx');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', e.target.files[0]);
    fd.append('type', 'purchase-orders');
    try {
      const res = await fetch(`${API}/api/helpdesk/upload-excel`, { method: 'POST', headers: auth(), body: fd });
      if (res.ok) { const d = await res.json(); alert(`Carga exitosa! ${d.count} registros procesados.`); fetchData(); }
      else alert('Error al subir el archivo.');
    } catch (err) { alert('Error de conexión al subir el archivo.'); }
    setUploading(false);
    e.target.value = '';
  };

  const inputCls = 'w-full border rounded-lg px-3 py-2 bg-white dark:bg-[#202c33] text-gray-900 dark:text-white';
  const orderLabel = (o: any) => `${o.cliente?.name || ''} - ${o.fecha ? new Date(o.fecha).toLocaleDateString() : ''}`;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Órdenes de Compra</h1>
          <p className="text-sm text-gray-500">Artículos/repuestos asociados a una orden 3D.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDownloadTemplate} className="px-3 py-2 border rounded-lg flex items-center gap-1 text-sm text-gray-700 dark:text-gray-200"><Download size={16}/> Plantilla</button>
          <label className={`px-3 py-2 rounded-lg flex items-center gap-1 text-sm cursor-pointer text-white ${uploading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}>
            <Upload size={16}/> {uploading ? 'Subiendo...' : 'Importar Excel'}
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} />
          </label>
          <button onClick={() => { setForm({ ...empty }); setShowModal(true); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1"><Plus size={18}/> Nuevo</button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111b21] rounded-xl shadow-sm border border-gray-100 dark:border-[#202c33] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-gray-50 dark:bg-[#202c33] border-b border-gray-100 dark:border-[#374248]">
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Orden 3D</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Nº Orden</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Recepción</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Precio</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#202c33]">
            {loading ? <tr><td colSpan={6} className="p-8 text-center">Cargando...</td></tr> : data.length === 0 ? <tr><td colSpan={6} className="p-8 text-center">No hay registros</td></tr> : data.map(p => {
              const parent = orders.find(o => o.id === p.serviceOrderId);
              return (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-[#202c33]">
                  <td className="p-4">{parent ? orderLabel(parent) : '—'}</td>
                  <td className="p-4 font-mono text-sm">{p.ordenNo || '—'}</td>
                  <td className="p-4">{p.recepcion || '—'}</td>
                  <td className="p-4">{p.precio || '—'}</td>
                  <td className="p-4">{p.estado || '—'}</td>
                  <td className="p-4 flex justify-end gap-2">
                    <button onClick={() => { setForm(p); setShowModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={18}/></button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#111b21] rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-[#202c33] flex justify-between items-center sticky top-0 bg-white dark:bg-[#111b21]">
              <h2 className="text-xl font-bold">{form.id ? 'Editar' : 'Nueva'} Orden de Compra</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:bg-gray-100 rounded-lg p-2">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Orden 3D (padre) *</label>
                <select value={form.serviceOrderId} onChange={e => setForm({ ...form, serviceOrderId: e.target.value })} className={inputCls} required>
                  <option value="">Seleccione la orden 3D...</option>
                  {orders.map(o => <option key={o.id} value={o.id}>{orderLabel(o)}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Nº Orden</label>
                  <input value={form.ordenNo} onChange={e => setForm({ ...form, ordenNo: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Fecha</label>
                  <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Recepción</label>
                  <input value={form.recepcion} onChange={e => setForm({ ...form, recepcion: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Estado</label>
                  <input value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Precio</label>
                  <input value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Abono</label>
                  <input value={form.abono} onChange={e => setForm({ ...form, abono: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Subtotal</label>
                  <input value={form.subtotal} onChange={e => setForm({ ...form, subtotal: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Asesor</label>
                  <input value={form.nombreAsesor} onChange={e => setForm({ ...form, nombreAsesor: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Observaciones</label>
                <textarea value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} className={inputCls} rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Tarea</label>
                <input value={form.tarea} onChange={e => setForm({ ...form, tarea: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Diagnóstico</label>
                  <textarea value={form.diagnosticoRealizado} onChange={e => setForm({ ...form, diagnosticoRealizado: e.target.value })} className={inputCls} rows={2} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Técnico</label>
                  <input value={form.tecnico} onChange={e => setForm({ ...form, tecnico: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Servicio realizado</label>
                  <input value={form.servicioRealizado} onChange={e => setForm({ ...form, servicioRealizado: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Cobrado</label>
                  <input value={form.cobrado} onChange={e => setForm({ ...form, cobrado: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Entregado</label>
                  <input value={form.entregado} onChange={e => setForm({ ...form, entregado: e.target.value })} className={inputCls} />
                </div>
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
