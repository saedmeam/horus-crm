"use client";
import { useEffect, useState } from 'react';
import { Shield, Plus, Edit, Trash2 } from 'lucide-react';

const AVAILABLE_SCREENS = [
  { id: '/', name: 'Chats' },
  { id: '/recordatorios', name: 'Recordatorios' },
  { id: '/kanban', name: 'Embudo (Kanban)' },
  { id: '/contacts', name: 'Contactos' },
  { id: '/admin/configuracion', name: 'Configuración General' },
  { id: '/admin/usuarios', name: 'Usuarios' },
  { id: '/admin/roles', name: 'Roles y Permisos' }
];

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [editingRole, setEditingRole] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    canViewAllChats: false,
    screenAccess: [] as string[]
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/roles`, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      if (res.ok) setRoles(await res.json());
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingRole ? 'PUT' : 'POST';
      const url = editingRole 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/roles/${editingRole.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/roles`;
        
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setEditingRole(null);
        setFormData({ name: '', canViewAllChats: false, screenAccess: [] });
        fetchRoles();
      } else {
        alert('Error guardando rol');
      }
    } catch(e) {
      alert('Error en el servidor');
    }
  };

  const toggleScreen = (screenId: string) => {
    setFormData(prev => ({
      ...prev,
      screenAccess: prev.screenAccess.includes(screenId)
        ? prev.screenAccess.filter(s => s !== screenId)
        : [...prev.screenAccess, screenId]
    }));
  };

  const startEdit = (role: any) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      canViewAllChats: role.canViewAllChats,
      screenAccess: role.screenAccess
    });
  };

  const handleDelete = async (id: string) => {
    if(!confirm('¿Eliminar este rol? Asegúrate de que no tenga usuarios asignados.')) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/roles/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    fetchRoles();
  };

  if (loading) return <div className="p-8">Cargando roles...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-8 h-8 text-blue-500" />
        <h1 className="text-2xl font-bold dark:text-white">Roles y Permisos</h1>
      </div>

      <div className="bg-white dark:bg-[#111b21] rounded-xl shadow p-6 mb-8 border border-gray-200 dark:border-gray-800">
        <h2 className="font-semibold text-lg mb-4">{editingRole ? 'Editar Rol' : 'Crear Nuevo Rol'}</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre del Rol</label>
            <input 
              required
              type="text" 
              className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
              placeholder="EJ: VENTAS"
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 rounded-lg">
            <input 
              type="checkbox" 
              id="allChats"
              checked={formData.canViewAllChats}
              onChange={e => setFormData({...formData, canViewAllChats: e.target.checked})}
              className="w-5 h-5 cursor-pointer"
            />
            <label htmlFor="allChats" className="cursor-pointer">
              <span className="font-semibold block text-blue-800 dark:text-blue-300">Notificar y ver TODOS los mensajes (Supervisión)</span>
              <span className="text-sm text-blue-600 dark:text-blue-400">Si se activa, este rol verá todos los chats sin importar qué línea tengan asignada.</span>
            </label>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Accesos a Pantallas</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AVAILABLE_SCREENS.map(screen => (
                <div key={screen.id} className="flex items-center gap-2 p-2 border rounded dark:border-gray-700">
                  <input 
                    type="checkbox" 
                    id={screen.id}
                    checked={formData.screenAccess.includes(screen.id)}
                    onChange={() => toggleScreen(screen.id)}
                  />
                  <label htmlFor={screen.id}>{screen.name}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              {editingRole ? 'Guardar Cambios' : 'Crear Rol'}
            </button>
            {editingRole && (
              <button type="button" onClick={() => { setEditingRole(null); setFormData({name:'', canViewAllChats:false, screenAccess:[]}) }} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-[#111b21] rounded-xl shadow overflow-hidden border border-gray-200 dark:border-gray-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="p-4 font-semibold">Rol</th>
              <th className="p-4 font-semibold">Ve Todo</th>
              <th className="p-4 font-semibold">Usuarios Asignados</th>
              <th className="p-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {roles.map((r: any) => (
              <tr key={r.id}>
                <td className="p-4 font-semibold">{r.name}</td>
                <td className="p-4">{r.canViewAllChats ? 'Sí' : 'No'}</td>
                <td className="p-4">{r._count?.users || 0}</td>
                <td className="p-4 text-right">
                  <button onClick={() => startEdit(r)} className="text-blue-500 hover:text-blue-700 mr-3">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
