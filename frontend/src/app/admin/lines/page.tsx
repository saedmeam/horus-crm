"use client";
import { useState, useEffect } from 'react';
import { Plus, Trash2, PhoneCall, Pencil } from 'lucide-react';

export default function LinesPage() {
  const [lines, setLines] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingLine, setEditingLine] = useState<any>(null);

  const [formData, setFormData] = useState({ name: '', phoneNumberId: '', wabaId: '', token: '' });
  const [editData, setEditData] = useState({ wabaId: '', token: '', phoneNumberId: '', active: true });

  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

  const fetchLines = async () => {
    const res = await fetch(`${api}/api/lines`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } });
    if (res.ok) setLines(await res.json());
  };

  useEffect(() => { fetchLines(); }, []);

  const handleCreateLine = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${api}/api/lines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
      body: JSON.stringify(formData)
    });
    if (res.ok) { setShowCreate(false); setFormData({ name: '', phoneNumberId: '', wabaId: '', token: '' }); fetchLines(); }
    else { const data = await res.json(); alert(data.error || 'Error al crear la línea'); }
  };

  const handleUpdateLine = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${api}/api/lines/${editingLine.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
      body: JSON.stringify(editData)
    });
    if (res.ok) { setEditingLine(null); fetchLines(); }
    else { const data = await res.json(); alert(data.error || 'Error al actualizar'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este canal? Se perderá la vinculación.')) return;
    const res = await fetch(`${api}/api/lines/${id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } });
    if (res.ok) fetchLines();
  };

  const openEdit = (line: any) => {
    setEditingLine(line);
    setEditData({ wabaId: line.wabaId || '', token: line.token || '', phoneNumberId: line.phoneNumberId || '', active: line.active });
  };

  const inputClass = 'w-full px-3 py-2 border rounded-lg text-black focus:ring-2 focus:ring-green-500 outline-none';

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Canales de WhatsApp</h2>
          <p className="text-sm text-gray-500 mt-1">Registra y administra los números de WhatsApp conectados a Meta.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"><Plus size={20} /> Registrar Canal</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lines.map(line => (
          <div key={line.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 flex gap-1">
              <button onClick={() => openEdit(line)} className="text-gray-300 hover:text-blue-500 transition-colors" title="Editar"><Pencil size={18} /></button>
              <button onClick={() => handleDelete(line.id)} className="text-gray-300 hover:text-red-500 transition-colors" title="Eliminar"><Trash2 size={18} /></button>
            </div>
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4"><PhoneCall size={24} /></div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">{line.name}</h3>
            <p className="text-sm text-gray-500 font-mono break-all mb-4 flex-1">ID: {line.phoneNumberId}</p>
            <div className="flex items-center gap-2 pt-4 border-t border-gray-100 mt-auto">
              <span className={`w-2.5 h-2.5 rounded-full ${line.active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              <span className="text-sm font-medium text-gray-600">{line.active ? 'Canal Activo' : 'Inactivo'}</span>
            </div>
          </div>
        ))}
        {lines.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">No hay canales de WhatsApp registrados.</div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200"><h3 className="text-lg font-bold text-gray-800">Registrar Nuevo Canal</h3></div>
            <form onSubmit={handleCreateLine} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Identificativo</label>
                <input type="text" required className={inputClass} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Soporte Técnico, Ventas 2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number ID (Meta)</label>
                <input type="text" required className={inputClass} value={formData.phoneNumberId} onChange={e => setFormData({...formData, phoneNumberId: e.target.value})} placeholder="Ej: 1350864618112079" />
                <p className="text-xs text-gray-500 mt-2">Obtén este ID desde Meta for Developers → WhatsApp → API Setup.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WABA ID (opcional)</label>
                <input type="text" className={inputClass} value={formData.wabaId} onChange={e => setFormData({...formData, wabaId: e.target.value})} placeholder="Ej: 1406360574269503" />
                <p className="text-xs text-gray-500 mt-2">Solo si este número pertenece a una cuenta distinta. Déjalo vacío si usas la misma cuenta.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Token de acceso (opcional)</label>
                <input type="password" className={inputClass} value={formData.token} onChange={e => setFormData({...formData, token: e.target.value})} placeholder="Déjalo vacío para usar el token global" />
                <p className="text-xs text-gray-500 mt-2">Solo si este número usa un token distinto (Business Manager diferente).</p>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">Registrar Canal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingLine && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200"><h3 className="text-lg font-bold text-gray-800">Editar Canal</h3></div>
            <form onSubmit={handleUpdateLine} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre (no editable)</label>
                <input type="text" disabled className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-500" value={editingLine.name} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number ID</label>
                <input type="text" required className={inputClass} value={editData.phoneNumberId} onChange={e => setEditData({...editData, phoneNumberId: e.target.value})} placeholder="Ej: 1350864618112079" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WABA ID</label>
                <input type="text" className={inputClass} value={editData.wabaId} onChange={e => setEditData({...editData, wabaId: e.target.value})} placeholder="Ej: 1406360574269503" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Token de acceso</label>
                <input type="password" className={inputClass} value={editData.token} onChange={e => setEditData({...editData, token: e.target.value})} placeholder="Déjalo vacío para usar el token global" />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={editData.active} onChange={e => setEditData({...editData, active: e.target.checked})} />
                Canal activo
              </label>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setEditingLine(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}