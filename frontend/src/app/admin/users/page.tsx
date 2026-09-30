"use client";
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'SALES',
    lineIds: [] as string[]
  });

  const fetchUsers = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    if (res.ok) setUsers(await res.json());
  };

  const fetchLines = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/lines`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    if (res.ok) setLines(await res.json());
  };

  useEffect(() => {
    fetchUsers();
    fetchLines();
  }, []);

  const openCreate = () => {
    setEditingUserId(null);
    setFormData({ name: '', username: '', email: '', password: '', role: 'SALES', lineIds: [] });
    setShowModal(true);
  };

  const openEdit = (user: any) => {
    setEditingUserId(user.id);
    setFormData({
      name: user.name,
      username: user.username || '',
      email: user.email,
      password: '', // Leave blank unless changing
      role: user.role,
      lineIds: user.lines ? user.lines.map((l: any) => l.id) : []
    });
    setShowModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingUserId 
      ? `http://localhost:3001/api/users/${editingUserId}`
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users`;
      
    const method = editingUserId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setShowModal(false);
      fetchUsers();
    } else {
      const data = await res.json();
      alert(data.error || 'Error al guardar usuario');
    }
  };

  const toggleLineSelection = (lineId: string) => {
    setFormData(prev => ({
      ...prev,
      lineIds: prev.lineIds.includes(lineId) 
        ? prev.lineIds.filter(id => id !== lineId)
        : [...prev.lineIds, lineId]
    }));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h2>
          <p className="text-sm text-gray-500 mt-1">Administra los accesos y roles del equipo.</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
              <th className="py-3 px-6 font-medium">Nombre / Usuario</th>
              <th className="py-3 px-6 font-medium">Correo</th>
              <th className="py-3 px-6 font-medium">Rol</th>
              <th className="py-3 px-6 font-medium">Líneas Asignadas</th>
              <th className="py-3 px-6 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-6">
                  <p className="font-medium text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-500">@{user.username || 'N/A'}</p>
                </td>
                <td className="py-3 px-6 text-sm text-gray-600">{user.email}</td>
                <td className="py-3 px-6">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-3 px-6 text-sm text-gray-600">
                  {user.lines && user.lines.length > 0 
                    ? user.lines.map((l: any) => l.name).join(', ') 
                    : <span className="text-gray-400">Sin líneas</span>}
                </td>
                <td className="py-3 px-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(user)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md transition-colors">
                      <Edit size={16} />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-red-600 rounded-md transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">
                  No hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">
                {editingUserId ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
              </h3>
            </div>
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                  <input type="text" required className="w-full px-3 py-2 border rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usuario (Login)</label>
                  <input type="text" required className="w-full px-3 py-2 border rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <input type="email" required className="w-full px-3 py-2 border rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingUserId ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}
                  </label>
                  <input type="password" required={!editingUserId} minLength={6} className="w-full px-3 py-2 border rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={editingUserId ? 'Dejar en blanco para no cambiar' : ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol de Sistema</label>
                  <select className="w-full px-3 py-2 border rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="SALES">Ventas (SALES)</option>
                    <option value="TECH">Soporte (TECH)</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="ADMIN">Administrador</option>
                    <option value="SUPERADMIN">Super Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 mt-2">Líneas de WhatsApp Asignadas (Multi-selección)</label>
                <div className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-32 overflow-y-auto">
                  {lines.map(line => (
                    <label key={line.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors">
                      <input 
                        type="checkbox" 
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        checked={formData.lineIds.includes(line.id)}
                        onChange={() => toggleLineSelection(line.id)}
                      />
                      <span className="text-sm text-gray-700 cursor-pointer">{line.name}</span>
                    </label>
                  ))}
                  {lines.length === 0 && <span className="text-sm text-gray-500">No hay líneas configuradas.</span>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                  Guardar Cambios
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
