"use client";
import React, { useState, useEffect } from 'react';
import MainSidebar from '@/components/MainSidebar';
import * as XLSX from 'xlsx';
import { Plus, Download, Search, X, LifeBuoy, FileText } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TicketsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [incidentTypes, setIncidentTypes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [form, setForm] = useState({
    ticketNumber: '',
    incidentType: '',
    subject: '', description: '',
    clientId: '',
    equipment: '',
    priority: 'Media',
    reportedBy: '',
    assignedUserId: '',
    status: 'ABIERTO'
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      window.location.href = '/login';
    } else {
      setUser(JSON.parse(storedUser));
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      
      const [ticketsRes, clientsRes, equipmentsRes, typesRes, usersRes] = await Promise.all([
        fetch(`${apiUrl}/api/tickets?line=3D`, { headers }),
        fetch(`${apiUrl}/api/helpdesk/clients?line=3D`, { headers }),
        fetch(`${apiUrl}/api/helpdesk/equipments?line=3D`, { headers }),
        fetch(`${apiUrl}/api/helpdesk/incident-types?line=3D`, { headers }),
        fetch(`${apiUrl}/api/users/agents`, { headers }) 
      ]);

      if (ticketsRes.ok) setTickets(await ticketsRes.json());
      if (clientsRes.ok) setClients(await clientsRes.json());
      if (equipmentsRes.ok) setEquipments(await equipmentsRes.json());
      if (typesRes.ok) setIncidentTypes(await typesRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleOpenNewTicket = async () => {
    setForm({
      ticketNumber: 'Cargando...',
      incidentType: '',
      subject: '',
      description: '',
      clientId: '',
      equipment: '',
      priority: 'Media',
      reportedBy: '',
      assignedUserId: '',
      status: 'ABIERTO'
    });
    setShowModal(true);

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      const res = await fetch(`${apiUrl}/api/tickets-next-id`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setForm(prev => ({ ...prev, ticketNumber: data?.nextId || 'Error' }));
      }
    } catch (e) {
      setForm(prev => ({ ...prev, ticketNumber: '' }));
    }
  };

  
  const exportToExcel = () => {
    if (tickets.length === 0) return;
    
    // 1. Sheet de Tickets
    const dataTickets = tickets.map((t: any) => ({
      "Nº Incidencia": t.ticketNumber,
      "Fecha Creación": new Date(t.createdAt).toLocaleString(),
      "Tipo de Incidencia": t.incidentType || 'N/A',
      "Prioridad": t.priority || 'N/A',
      "Estado": t.status,
      "Cliente": t.client?.name || 'N/A',
      "Equipo": t.equipment || 'N/A',
      "Asunto": t.subject || 'N/A',
      "Descripción": t.description || '',
      "Reportado por": t.reportedBy || 'N/A',
      "Técnico Asignado": t.assignedUser?.name || 'No asignado',
      "Última Actualización": new Date(t.updatedAt).toLocaleString()
    }));

    // 2. Sheet de Reportes (Resoluciones)
    const dataReports: any[] = [];
    tickets.forEach((t: any) => {
      if (t.reports && t.reports.length > 0) {
        t.reports.forEach((r: any) => {
          dataReports.push({
            "Nº Incidencia": t.ticketNumber,
            "Cliente": t.client?.name || 'N/A',
            "Tarea Ejecutada": r.task || 'N/A',
            "Modalidad": r.attentionModality || 'N/A',
            "Fecha Inicio": r.startDate ? new Date(r.startDate).toLocaleString() : '',
            "Fecha Fin": r.endDate ? new Date(r.endDate).toLocaleString() : '',
            "Trabajo Realizado": r.workDone || '',
            "Observaciones": r.observation || '',
            "Técnico Ejecutor": r.technician?.name || 'N/A',
            "Estado Reporte": r.status || 'N/A',
            "Firmado Por": r.clientName || 'No firmado',
            "Fecha Reporte": new Date(r.createdAt).toLocaleString()
          });
        });
      }
    });

    const workbook = XLSX.utils.book_new();
    
    const wsTickets = XLSX.utils.json_to_sheet(dataTickets);
    XLSX.utils.book_append_sheet(workbook, wsTickets, "Tickets Generales");
    
    if (dataReports.length > 0) {
      const wsReports = XLSX.utils.json_to_sheet(dataReports);
      XLSX.utils.book_append_sheet(workbook, wsReports, "Reportes de Trabajo");
    }
    
    XLSX.writeFile(workbook, "Mesa_de_Ayuda_Export.xlsx");
  };

  const handleSaveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      const res = await fetch(`${apiUrl}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...form, businessLine: '3D' })
      });
      if (res.ok) {
        setShowModal(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredEquipments = form.clientId 
    ? equipments.filter(e => e.clientId === form.clientId) 
    : equipments;

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-gray-50">Cargando Tickets...</div>;
  }

  return (
    <div className="flex h-screen w-full bg-[#f4f7f6] dark:bg-[#111b21] overflow-hidden">
      <MainSidebar user={user} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white dark:bg-[#202c33] border-b border-gray-200 dark:border-[#374248] flex items-center px-6 shrink-0 shadow-sm z-10 justify-between">
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
            <LifeBuoy className="w-6 h-6 text-blue-600 dark:text-[#00a884]" />
            Soporte Técnico (3D)
          </h1>
          <div className="flex items-center gap-4">
            <Link 
              href="/admin/helpdesk-catalogs"
              className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors"
            >
              Configurar Catálogos
            </Link>
            
              <button 
                onClick={exportToExcel}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm shadow-green-500/20"
              >
                <Download className="w-4 h-4" /> Exportar a Excel
              </button>

              <button 
              onClick={handleOpenNewTicket}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> Nuevo Ticket
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="bg-white dark:bg-[#202c33] border border-gray-200 dark:border-[#374248] rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#2a3942] border-b border-gray-200 dark:border-[#374248]">
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm"># Incidencia</th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Cliente</th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Asunto</th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Prioridad</th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Estado</th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Técnico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#374248]">
                {tickets.map(t => (
                  <tr key={t.id} onClick={() => router.push(`/tickets-3d/${t.id}`)} className="hover:bg-gray-50 dark:hover:bg-[#2a3942] transition-colors cursor-pointer">
                    <td className="p-4 text-sm font-medium text-blue-600 dark:text-[#00a884]">{t.ticketNumber}</td>
                    <td className="p-4 text-sm text-gray-800 dark:text-gray-200">{t.client?.name || 'Sin Cliente'}</td>
                    <td className="p-4 text-sm text-gray-800 dark:text-gray-200">{t.subject || 'Sin Asunto'}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                        t.priority === 'Alta' ? 'bg-red-100 text-red-700' :
                        t.priority === 'Media' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs px-2 py-1 rounded-full font-bold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        {t.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-800 dark:text-gray-200">{t.assignedUser?.name || 'No asignado'}</td>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No hay tickets registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111b21] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-[#374248]">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600 dark:text-[#00a884]" />
                Soluciones Medicas Form
              </h2>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 dark:border-[#374248] rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-[#202c33]">
                  Cancel
                </button>
                <button type="button" onClick={handleSaveTicket} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                  Save
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Nº de Incidencia</label>
                  <input type="text" value={form.ticketNumber} disabled className="w-full border border-gray-300 dark:border-[#374248] rounded-xl px-4 py-2.5 bg-gray-100 dark:bg-[#2a3942] text-gray-900 dark:text-white outline-none cursor-not-allowed font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tipo de Incidencia</label>
                  <select value={form.incidentType} onChange={e => setForm({...form, incidentType: e.target.value})} className="w-full border border-gray-300 dark:border-[#374248] rounded-xl px-4 py-2.5 bg-white dark:bg-[#202c33] text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow">
                    <option value="">Seleccione...</option>
                    {incidentTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>

                
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Descripción del Problema</label>
                  <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Detalle toda la información necesaria de la incidencia..." className="w-full border border-gray-300 dark:border-[#374248] rounded-xl px-4 py-3 bg-white dark:bg-[#202c33] text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow resize-none"></textarea>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Asunto / Título breve</label>
                  <input type="text" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="Ej: Falla de conexión en el servidor principal" className="w-full border border-gray-300 dark:border-[#374248] rounded-xl px-4 py-2.5 bg-white dark:bg-[#202c33] text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Cliente</label>
                  <select value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} className="w-full border border-gray-300 dark:border-[#374248] rounded-xl px-4 py-2.5 bg-white dark:bg-[#202c33] text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow">
                    <option value="">Seleccione un cliente...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Equipo o Sistema</label>
                  <select value={form.equipment} onChange={e => setForm({...form, equipment: e.target.value})} disabled={!form.clientId} className="w-full border border-gray-300 dark:border-[#374248] rounded-xl px-4 py-2.5 bg-white dark:bg-[#202c33] text-gray-900 dark:text-white outline-none disabled:opacity-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow">
                    <option value="">{form.clientId ? 'Seleccione un equipo...' : 'Primero seleccione un cliente'}</option>
                    {filteredEquipments.map(e => <option key={e.id} value={e.name}>{e.name} {e.brand ? `(${e.brand})` : ''}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Prioridad</label>
                  <div className="flex rounded-xl shadow-sm border border-gray-300 dark:border-[#374248] overflow-hidden">
                    {['Baja', 'Media', 'Alta'].map(p => (
                      <button key={p} type="button" onClick={() => setForm({...form, priority: p})} className={`flex-1 py-2.5 text-sm font-medium transition-colors ${form.priority === p ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold' : 'bg-white dark:bg-[#202c33] text-gray-700 dark:text-gray-300 hover:bg-gray-50'}`}>{p}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Reportado por (Nombre)</label>
                  <input type="text" value={form.reportedBy} onChange={e => setForm({...form, reportedBy: e.target.value})} placeholder="Ej: Dra. María Gómez" className="w-full border border-gray-300 dark:border-[#374248] rounded-xl px-4 py-2.5 bg-white dark:bg-[#202c33] text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Técnico Asignado</label>
                  <select value={form.assignedUserId} onChange={e => setForm({...form, assignedUserId: e.target.value})} className="w-full border border-gray-300 dark:border-[#374248] rounded-xl px-4 py-2.5 bg-white dark:bg-[#202c33] text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow">
                    <option value="">Dejar sin asignar...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name || u.username}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Estado de ticket</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full border border-gray-300 dark:border-[#374248] rounded-xl px-4 py-2.5 bg-white dark:bg-[#202c33] text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow">
                    <option value="ABIERTO">Abierto (Pendiente)</option>
                    <option value="SEGUIMIENTO">En Seguimiento</option>
                    <option value="CERRADO">Cerrado / Resuelto</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
