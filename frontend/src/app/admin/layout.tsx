"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Users, Phone, Settings, LogOut, BellRing, BarChart3, Shield, Server, AlertTriangle, CheckSquare, Truck, Wrench, Briefcase, UserCheck, Clock, MessageSquarePlus, LayoutDashboard, List, Package, TrendingUp, AlarmClock, FileText, Globe } from 'lucide-react';
import Link from 'next/link';
import MainSidebar from '@/components/MainSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) {
      router.push('/login');
      return;
    }
    const parsedUser = JSON.parse(userData || '{}');
    setUser(parsedUser);
  }, [router]);

  if (!user) return null; // Loading state

  const isAdmin = user.role === 'SUPERADMIN' || user.role === 'ADMIN';

  const allNavItems = [
    { name: 'Dashboard', icon: BarChart3, href: '/admin/dashboard', requiresAdmin: true },
    { name: 'Notificaciones', icon: BellRing, href: '/admin/notificaciones', requiresAdmin: false },
    { name: 'Roles', icon: Shield, href: '/admin/roles', requiresAdmin: true },
    { name: 'Usuarios', icon: Users, href: '/admin/users', requiresAdmin: true },
    
      { name: 'Catálogo: Clientes', icon: Users, href: '/admin/clientes', requiresAdmin: true },
    { name: 'Catálogo: Equipos', icon: Server, href: '/admin/equipos', requiresAdmin: true },
    { name: 'Catálogo: Incidencias', icon: AlertTriangle, href: '/admin/incidencias', requiresAdmin: true },
    { name: 'Catálogo: Tareas', icon: CheckSquare, href: '/admin/tareas', requiresAdmin: true },
    { name: 'Catálogo: Proveedores', icon: Truck, href: '/admin/proveedores', requiresAdmin: true },
    { name: 'Catálogo: Repuestos', icon: Wrench, href: '/admin/repuestos', requiresAdmin: true },
    { name: 'Catálogo: Servicios', icon: Briefcase, href: '/admin/servicios', requiresAdmin: true },
    { name: 'Catálogo: Recepción', icon: UserCheck, href: '/admin/recepcion', requiresAdmin: true },
    { name: 'Catálogo: ETA', icon: Clock, href: '/admin/eta', requiresAdmin: true },
    { name: 'Líneas WhatsApp', icon: Phone, href: '/admin/lines', requiresAdmin: true },
    { name: 'Respuestas Rápidas', icon: MessageSquarePlus, href: '/admin/snippets', requiresAdmin: true },
    { name: 'Etapas Kanban', icon: LayoutDashboard, href: '/admin/kanban-settings', requiresAdmin: true },
    { name: 'Campos Contactos', icon: List, href: '/admin/contact-fields', requiresAdmin: true },
    { name: 'Reporte Pedidos', icon: Package, href: '/admin/pedidos', requiresAdmin: true },
    { name: 'Reporte Ventas', icon: TrendingUp, href: '/admin/ventas', requiresAdmin: true },
    { name: 'Reporte Vendedor', icon: Users, href: '/admin/reporte-vendedor', requiresAdmin: true },
    { name: 'Reporte Recordatorios', icon: AlarmClock, href: '/admin/recordatorios', requiresAdmin: true },
    { name: 'Plantillas Meta', icon: FileText, href: '/admin/plantillas', requiresAdmin: true },
    { name: 'Configuración API', icon: Globe, href: '/admin/configuracion', requiresAdmin: true },
  ];

  const navItems = allNavItems.filter(item => !item.requiresAdmin || isAdmin);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Principal */}
      <MainSidebar user={user} />
      
      {/* Submenú de Configuración */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Configuración</h2>
        </div>
        
        <div className="p-4 flex-1 min-h-0 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Opciones</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-lg font-semibold text-gray-800">Panel de Control ({user.role})</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-600">{user.name}</span>
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
              {user.name?.charAt(0) || 'U'}
            </div>
          </div>
        </header>
        <main className="p-8 flex-1 overflow-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
