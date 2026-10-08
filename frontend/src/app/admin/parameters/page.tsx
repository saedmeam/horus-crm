"use client";
import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function ParametersPage() {
  const [params, setParams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ 
    id: '', 
    parentId: '0', 
    mnemonic: '', 
    name: '', 
    value: '', 
    description: '',
    numericValue: '',
    status: 'A'
  });

  useEffect(() => {
    fetchParams();
  }, []);

  const fetchParams = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/parameters`, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      if (res.ok) {
        setParams(await res.json());
      } else {
        const err = await res.json();
        alert("Error Backend: " + JSON.stringify(err));
      }
    } catch(e: any) {
      alert("Error Frontend: " + e.message);
      console.error(e);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = form.id 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/parameters/${form.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/parameters`;
      
      const res = await fetch(url, {
        method: form.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setShowModal(false);
        fetchParams();
      } else {
        const err = await res.json();
        alert("Error al guardar: " + JSON.stringify(err));
      }
    } catch(e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este parámetro?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/parameters/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      if (res.ok) {
        fetchParams();
      } else {
        const err = await res.json();
        alert("Error al eliminar: " + JSON.stringify(err));
      }
    } catch(e) { console.error(e); }
  };

  const handleMigrate = async () => {
    if(!confirm('¿Migrar datos antiguos de Mesa de Ayuda a Parámetros?')) return;
    setLoading(true);
    try {
      const migRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/parameters/migrate`, { 
        method: 'POST', 
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } 
      });
      if(!migRes.ok) { 
        const migErr = await migRes.json(); 
        alert("Migration Error: " + JSON.stringify(migErr)); 
      } else {
        alert("Migración exitosa");
      }
    } catch (e: any) {
      alert("Error de red: " + e.message);
    }
    fetchParams();
  };

  const openNew = () => {
    setForm({ id: '', parentId: '0', mnemonic: '', name: '', value: '', description: '', numericValue: '', status: 'A' });
    setShowModal(true);
  };

  const openEdit = (p: any) => {
    setForm({ 
      id: p.id, 
      parentId: p.parentId || '0', 
      mnemonic: p.mnemonic || '', 
      name: p.name, 
      value: p.value || '', 
      description: p.description || '',
      numericValue: p.numericValue ? p.numericValue.toString() : '',
      status: p.status || 'A'
    });
    setShowModal(true);
  };

  // Get only root parameters to show in the Parent dropdown
  // Let's show all parameters so we can nest Equipments under Clients
  const getParentName = (id: string) => {
    const p = params.find(x => x.id === id);
    return p ? p.name : '';
  };
  
  // Sort them so roots are first, then children
  const allParams = [...params].sort((a, b) => {
    if (!a.parentId && b.parentId) return -1;
    if (a.parentId && !b.parentId) return 1;
    return a.name.localeCompare(b.name);
  });


  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Parámetros del Sistema</h1>
          <p className="text-sm text-gray-500">Gestión centralizada de catálogos y combos</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleMigrate} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            Migrar Antiguos
          </button>
          <button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Plus size={18} /> Nuevo Parámetro
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111b21] rounded-xl shadow-sm border border-gray-100 dark:border-[#202c33] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-[#202c33] border-b border-gray-100 dark:border-[#374248]">
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Padre</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nemónico</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre (Detalle)</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor Texto</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-[#202c33]">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">Cargando...</td></tr>
            ) : params.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">No hay parámetros configurados</td></tr>
            ) : (
              params.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-[#202c33] transition-colors">
                  <td className="p-4 text-sm font-medium text-blue-600">{p.parent?.name || '--- (RAÍZ)'}</td>
                  <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-100">{p.mnemonic || '-'}</td>
                  <td className="p-4 text-sm text-gray-700 dark:text-gray-300">{p.name}</td>
                  <td className="p-4 text-sm text-gray-700 dark:text-gray-300">{p.value || '-'}</td>
                  <td className="p-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${p.status === 'A' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.status === 'A' ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>
                  <td className="p-4 flex justify-end gap-2">
                    <button onClick={() => openEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto pt-10 pb-10">
          <div className="bg-white dark:bg-[#111b21] rounded-2xl w-full max-w-lg p-6 shadow-xl my-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
              {form.id ? 'Editar Parámetro' : 'Nuevo Parámetro'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Parámetro Padre</label>
                  <select 
                    value={form.parentId} 
                    onChange={e => setForm({...form, parentId: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-[#202c33]"
                  >
                    <option value="0">--- NINGUNO (RAÍZ) ---</option>
                    {allParams.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.parentId ? `${getParentName(p.parentId)} -> ` : '📌 '} 
                        {p.name} {p.mnemonic ? `(${p.mnemonic})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Nemónico (Clave única)</label>
                  <input 
                    type="text" 
                    value={form.mnemonic} 
                    onChange={e => setForm({...form, mnemonic: e.target.value.toUpperCase()})}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-[#202c33]"
                    placeholder="Ej: CLIENTES_SM"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Detalle (Nombre)</label>
                  <input 
                    type="text" 
                    required
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-[#202c33]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Valor Texto</label>
                  <input 
                    type="text" 
                    value={form.value} 
                    onChange={e => setForm({...form, value: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-[#202c33]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Valor Numérico</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={form.numericValue} 
                    onChange={e => setForm({...form, numericValue: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-[#202c33]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Estado</label>
                  <select 
                    value={form.status} 
                    onChange={e => setForm({...form, status: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-[#202c33]"
                  >
                    <option value="A">Activo (A)</option>
                    <option value="I">Inactivo (I)</option>
                  </select>
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Descripción extra</label>
                  <textarea 
                    value={form.description} 
                    onChange={e => setForm({...form, description: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 dark:bg-[#202c33]"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}