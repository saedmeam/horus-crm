"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, LayoutDashboard, Users, Settings, LogOut, KeyRound, AlarmClock } from 'lucide-react';

export default function MainSidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) user = {};

  const isAdmin = user?.role === 'SUPERADMIN' || user?.role?.name === 'SUPERADMIN' || user?.roleData?.name === 'SUPERADMIN' || user?.role === 'ADMIN' || user?.role?.name === 'ADMIN' || user?.roleData?.name === 'ADMIN';

  const menuItems = [
    { name: 'Recordatorios', icon: AlarmClock, href: '/recordatorios' },
    { name: 'Chats', icon: MessageSquare, href: '/' },
    { name: 'Embudo (Kanban)', icon: LayoutDashboard, href: '/kanban' },
    { name: 'Contactos', icon: Users, href: '/contacts' },
      { name: 'Configuración', icon: Settings, href: '/admin/notificaciones' },
  ];

  

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('Las contraseñas nuevas no coinciden');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}`}/api/users/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Contraseña actualizada con éxito');
        setTimeout(() => {
          setShowPasswordModal(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setSuccessMsg('');
        }, 2000);
      } else {
        setErrorMsg(data.error || 'Error al cambiar contraseña');
      }
    } catch (err) {
      setErrorMsg('Error de conexión');
    }
  };

  return (
    <>
      <div className="bg-[#0f171e] text-white flex flex-col items-center py-6 border-r border-gray-800 shrink-0 relative z-40 overflow-y-auto overflow-x-hidden" style={{ width: "80px", minWidth: "80px" }}>
        <div className="mb-8">
          <img src="/logo-icon.png" alt="Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
        </div>

        <nav className="flex-1 w-full flex flex-col items-center space-y-4">
          {menuItems.filter(item => {
              if (isAdmin) return true;
              if (!user?.roleData?.screenAccess) {
                 if (item.href.startsWith('/admin')) return false;
                 return true;
              }
              return user.roleData.screenAccess.includes(item.href);
            }).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`relative flex flex-col items-center p-3 rounded-xl transition-all duration-200 group w-12 h-12 md:w-14 md:h-14 justify-center ${
                  isActive 
                    ? 'bg-blue-600/20 text-blue-500' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                title={item.name}
              >
                <Icon size={24} className={isActive ? 'text-blue-500' : ''} />
                
                {/* Tooltip for hover */}
                <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Botones de Acción Abajo */}
        <div className="mt-auto w-full flex flex-col items-center space-y-4 mb-4">
          <button 
            onClick={() => setShowPasswordModal(true)}
            className="relative flex flex-col items-center p-3 rounded-xl transition-all duration-200 group w-12 h-12 md:w-14 md:h-14 justify-center text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <KeyRound size={24} />
            <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
              Cambiar Contraseña
            </div>
          </button>

          <button 
            onClick={handleLogout}
            className="relative flex flex-col items-center p-3 rounded-xl transition-all duration-200 group w-12 h-12 md:w-14 md:h-14 justify-center text-gray-400 hover:text-red-500 hover:bg-red-500/10"
          >
            <LogOut size={24} />
            <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
              Cerrar Sesión
            </div>
          </button>
        </div>
      </div>

      {/* Modal Cambio de Contraseña */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden text-gray-800">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <KeyRound size={20} className="text-blue-600"/> Mi Perfil (Clave)
              </h3>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              
              {errorMsg && <div className="p-2 bg-red-100 text-red-700 text-sm rounded-lg">{errorMsg}</div>}
              {successMsg && <div className="p-2 bg-green-100 text-green-700 text-sm rounded-lg">{successMsg}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
                <input 
                  type="password" 
                  required 
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={currentPassword} 
                  onChange={e => setCurrentPassword(e.target.value)} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                <input 
                  type="password" 
                  required 
                  minLength={6}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
                <input 
                  type="password" 
                  required 
                  minLength={6}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 mt-4">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                  Actualizar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}


