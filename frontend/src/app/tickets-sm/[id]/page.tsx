"use client";
import React, { useState, useEffect } from 'react';
import MainSidebar from '@/components/MainSidebar';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, FileText, CheckCircle, Clock } from 'lucide-react';

export default function TicketDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  
  const [user, setUser] = useState<any>(null);
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal Reporte
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEditTicketModal, setShowEditTicketModal] = useState(false);
  const [taskTypes, setTaskTypes] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [incidentTypes, setIncidentTypes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [editForm, setEditForm] = useState<any>({});
  const [form, setForm] = useState({
    task: '',
    attentionModality: 'Remoto',
    startDate: '',
    endDate: '',
    workDone: '',
    observation: '',
    status: 'Iniciado',
    clientName: '',
    clientEmail: '',
      ccEmail: '',
      techEmail: '',
    });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      window.location.href = '/login';
    } else {
      setUser(JSON.parse(storedUser));
      fetchTicket();
      fetchCatalogs();
      fetchAllCatalogs();
    }
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      const res = await fetch(`${apiUrl}/api/tickets/${ticketId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTicket(data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  
  const fetchAllCatalogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      
      const [clientsRes, equipmentsRes, typesRes, usersRes] = await Promise.all([
        fetch(`${apiUrl}/api/helpdesk/clients?line=SM`, { headers }),
        fetch(`${apiUrl}/api/helpdesk/equipments?line=SM`, { headers }),
        fetch(`${apiUrl}/api/helpdesk/incident-types?line=SM`, { headers }),
        fetch(`${apiUrl}/api/users/agents`, { headers }) 
      ]);

      if (clientsRes.ok) setClients(await clientsRes.json());
      if (equipmentsRes.ok) setEquipments(await equipmentsRes.json());
      if (typesRes.ok) setIncidentTypes(await typesRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCatalogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      const res = await fetch(`${apiUrl}/api/helpdesk/task-types?line=SM`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setTaskTypes(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  
  const handleSaveTicketEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      const payload = { ...editForm };
      
      // empty string to null conversion is handled by backend now, but good practice
      if (!payload.clientId) payload.clientId = null;
      if (!payload.assignedUserId) payload.assignedUserId = null;

      const res = await fetch(`${apiUrl}/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowEditTicketModal(false);
        fetchTicket();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      
      const payload = {
        ...form,
        technicianId: user.id, // Current logged user
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      };

      const res = await fetch(`${apiUrl}/api/tickets/${ticketId}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowReportModal(false);
        fetchTicket(); // refresh
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50">Cargando...</div>;
  if (!ticket) return <div className="flex h-screen items-center justify-center bg-gray-50">Ticket no encontrado</div>;

  return (
    <div className="flex h-screen w-full bg-[#f4f7f6] dark:bg-[#111b21] overflow-hidden">
      <MainSidebar user={user} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white dark:bg-[#202c33] border-b border-gray-200 dark:border-[#374248] flex items-center px-6 shrink-0 shadow-sm z-10 gap-4">
          <button onClick={() => router.push('/tickets-sm')} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            Ticket {ticket.ticketNumber}
          </h1>
          <span className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full font-medium">
            {ticket.status}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-6 flex gap-6 items-start">
          {/* Detalles del Ticket */}
          <div className="w-1/3 bg-white dark:bg-[#202c33] rounded-xl shadow-sm border border-gray-200 dark:border-[#374248] p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2"><h2 className="font-bold text-lg text-gray-800 dark:text-gray-100">Información del Ticket</h2><button onClick={() => { setEditForm(ticket); setShowEditTicketModal(true); }} className="text-blue-600 text-sm font-semibold hover:underline">Editar</button></div>
            
            <div>
              <span className="block text-xs text-gray-500 font-semibold uppercase">Asunto</span>
              <span className="text-gray-800 dark:text-gray-200">{ticket.subject || 'Sin Asunto'}</span>
            </div>
            {ticket.description && <div>
              <span className="block text-xs text-gray-500 font-semibold uppercase">Descripción</span>
              <span className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{ticket.description}</span>
            </div>}
            
            <div>
              <span className="block text-xs text-gray-500 font-semibold uppercase">Cliente</span>
              <span className="text-gray-800 dark:text-gray-200">{ticket.client?.name || 'N/A'}</span>
            </div>

            <div>
              <span className="block text-xs text-gray-500 font-semibold uppercase">Equipo</span>
              <span className="text-gray-800 dark:text-gray-200">{ticket.equipment || 'N/A'}</span>
            </div>

            <div>
              <span className="block text-xs text-gray-500 font-semibold uppercase">Tipo Incidencia</span>
              <span className="text-gray-800 dark:text-gray-200">{ticket.incidentType || 'N/A'}</span>
            </div>

            <div>
              <span className="block text-xs text-gray-500 font-semibold uppercase">Técnico Asignado</span>
              <span className="text-gray-800 dark:text-gray-200">{ticket.assignedUser?.name || 'No asignado'}</span>
            </div>
          </div>

          {/* Historial de Reportes */}
          <div className="flex-1 bg-white dark:bg-[#202c33] rounded-xl shadow-sm border border-gray-200 dark:border-[#374248] p-5">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-3">
              <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100">Reportes y Tareas</h2>
              <button 
                onClick={() => setShowReportModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Nuevo Reporte
              </button>
            </div>

            <div className="relative border-l-2 border-gray-100 dark:border-gray-700 ml-4 pl-6 space-y-8 mt-6">
              {ticket.reports && ticket.reports.length > 0 ? (
                ticket.reports.map((r: any) => (
                  <div key={r.id} className="relative">
                    <div className="absolute -left-[35px] top-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 border-4 border-white dark:border-[#202c33] rounded-full shadow-sm flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-[#111b21] border border-gray-100 dark:border-[#374248] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-lg text-blue-700 dark:text-blue-400">{r.task || 'Reporte de Tarea'}</h3>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white dark:bg-gray-800 text-gray-500 shadow-sm border border-gray-200 dark:border-gray-700">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed"><strong className="text-gray-900 dark:text-white">Se realizó: </strong>{r.workDone}</p>
                        {r.observation && <p className="text-gray-600 italic mt-2 border-l-2 border-blue-400 pl-3">"{r.observation}"</p>}
                      </div>
                      
                      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1.5 bg-white dark:bg-[#202c33] px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700"><Clock className="w-3.5 h-3.5 text-blue-500" /> Modalidad: {r.attentionModality}</span>
                        <span className="flex items-center gap-1.5 bg-white dark:bg-[#202c33] px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> {r.status}</span>
                        <span className="flex items-center gap-1.5 bg-white dark:bg-[#202c33] px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700"><div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-[10px] text-gray-600 overflow-hidden">{r.technician?.signatureUrl ? <img src={r.technician.signatureUrl} className="w-full h-full object-cover"/> : 'T'}</div> {r.technician?.name || 'Técnico'}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="absolute top-0 -left-[27px] w-full pt-4">
                  <div className="text-center p-10 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-[#111b21]/50 ml-12">
                    <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-200 dark:border-gray-700">
                      <FileText className="w-8 h-8 text-blue-400 opacity-60" />
                    </div>
                    <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-1">Aún no hay reportes</h3>
                    <p className="text-sm text-gray-500">Agrega el primer reporte de trabajo haciendo clic en "Nuevo Reporte".</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111b21] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-[#374248]">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Crear Reporte de Trabajo</h2>
              <button onClick={() => setShowReportModal(false)} className="text-gray-500 hover:text-gray-800">Cerrar</button>
            </div>
            
            <form onSubmit={handleSaveReport} className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-1 dark:text-gray-300">Tarea Ejecutada</label>
                  <select required value={form.task} onChange={e => setForm({...form, task: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 dark:bg-[#202c33] dark:border-[#374248] focus:border-blue-500 focus:ring-1 outline-none transition-shadow">
                    <option value="">Seleccione...</option>
                    {taskTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 dark:text-gray-300">Modalidad de Atención</label>
                  <select value={form.attentionModality} onChange={e => setForm({...form, attentionModality: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 dark:bg-[#202c33] dark:border-[#374248] focus:border-blue-500 focus:ring-1 outline-none transition-shadow">
                    <option value="Remoto">Remoto</option>
                    <option value="Presencial">Presencial</option>
                    <option value="Mixto">Mixto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1 dark:text-gray-300">Fecha de Inicio</label>
                  <input type="datetime-local" required value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 dark:bg-[#202c33] dark:border-[#374248] focus:border-blue-500 focus:ring-1 outline-none transition-shadow" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 dark:text-gray-300">Fecha de Fin</label>
                  <input type="datetime-local" required value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 dark:bg-[#202c33] dark:border-[#374248] focus:border-blue-500 focus:ring-1 outline-none transition-shadow" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-1 dark:text-gray-300">Detalle del Trabajo Realizado</label>
                  <textarea required rows={3} placeholder="Describa a detalle el trabajo efectuado..." value={form.workDone} onChange={e => setForm({...form, workDone: e.target.value})} className="w-full border rounded-xl px-4 py-3 dark:bg-[#202c33] dark:border-[#374248] focus:border-blue-500 focus:ring-1 outline-none transition-shadow resize-none"></textarea>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-1 dark:text-gray-300">Observaciones y Recomendaciones (Opcional)</label>
                  <textarea rows={2} placeholder="Sugerencias o pendientes..." value={form.observation} onChange={e => setForm({...form, observation: e.target.value})} className="w-full border rounded-xl px-4 py-3 dark:bg-[#202c33] dark:border-[#374248] focus:border-blue-500 focus:ring-1 outline-none transition-shadow resize-none"></textarea>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-5 mt-6">
                <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-[#00a884]"/> Información del Cliente para Firmar
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-500 uppercase tracking-wider">Nombre de quien firma</label>
                    <input type="text" placeholder="Ej: Dr. Fernando Pérez" value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 text-sm dark:bg-[#202c33] dark:border-[#374248] focus:border-blue-500 focus:ring-1 outline-none transition-shadow" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-500 uppercase tracking-wider">Correo de notificación</label>
                    <input type="email" placeholder="correo@hospital.com" value={form.clientEmail} onChange={e => setForm({...form, clientEmail: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 text-sm dark:bg-[#202c33] dark:border-[#374248] focus:border-blue-500 focus:ring-1 outline-none transition-shadow" />
                  </div>
                  </div>
                </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-5 mt-6">
                    <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-[#00a884]"/> Envio de Correos y Adjuntos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-semibold mb-1 text-gray-500 uppercase tracking-wider">Estado Correo</label>
                        <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 text-sm dark:bg-[#202c33] dark:border-[#374248] focus:border-blue-500 focus:ring-1 outline-none transition-shadow">
                          <option value="Iniciado">Iniciado</option>
                          <option value="Completado">Completado</option>
                        </select>
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-semibold mb-1 text-gray-500 uppercase tracking-wider">PDF Generado</label>
                        <div className="w-full border border-dashed rounded-xl px-4 py-2 text-sm text-center text-gray-500 flex items-center justify-center cursor-not-allowed">
                          No hay PDF adjunto
                        </div>
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-semibold mb-1 text-gray-500 uppercase tracking-wider">Correo CC</label>
                        <input type="email" placeholder="cc@empresa.com" value={form.ccEmail || ''} onChange={e => setForm({...form, ccEmail: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 text-sm dark:bg-[#202c33] dark:border-[#374248] focus:border-blue-500 focus:ring-1 outline-none transition-shadow" />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-semibold mb-1 text-gray-500 uppercase tracking-wider">Correo Técnico</label>
                        <input type="email" placeholder="tecnico@horustech.com" value={form.techEmail || ''} onChange={e => setForm({...form, techEmail: e.target.value})} className="w-full border rounded-xl px-4 py-2.5 text-sm dark:bg-[#202c33] dark:border-[#374248] focus:border-blue-500 focus:ring-1 outline-none transition-shadow" />
                      </div>
                    </div>
                  </div>

                <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={() => setShowReportModal(false)} className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#202c33] transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-colors">Guardar Reporte</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditTicketModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111b21] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-[#374248]">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Editar Ticket</h2>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowEditTicketModal(false)} className="px-4 py-2 border rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-600 dark:text-gray-300 text-gray-700">Cancel</button>
                <button type="button" onClick={handleSaveTicketEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Guardar Cambios</button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tipo de Incidencia</label>
                  <select value={editForm.incidentType || ''} onChange={e => setEditForm({...editForm, incidentType: e.target.value})} className="w-full border border-gray-300 dark:border-[#374248] rounded-xl px-4 py-2.5 bg-white dark:bg-[#202c33] text-gray-900 dark:text-white outline-none">
                    <option value="">Seleccione...</option>
                    {incidentTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Estado de ticket</label>
                  <select value={editForm.status || 'ABIERTO'} onChange={e => setEditForm({...editForm, status: e.target.value})} className="w-full border border-gray-300 dark:border-[#374248] rounded-xl px-4 py-2.5 bg-white dark:bg-[#202c33] text-gray-900 dark:text-white outline-none">
                    <option value="ABIERTO">Abierto (Pendiente)</option>
                    <option value="SEGUIMIENTO">En Seguimiento</option>
                    <option value="CERRADO">Cerrado / Resuelto</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Descripción del Problema</label>
                  <textarea rows={3} value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full border border-gray-300 dark:border-[#374248] rounded-xl px-4 py-3 bg-white dark:bg-[#202c33] text-gray-900 dark:text-white outline-none"></textarea>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Asunto / Título breve</label>
                  <input type="text" value={editForm.subject || ''} onChange={e => setEditForm({...editForm, subject: e.target.value})} className="w-full border border-gray-300 dark:border-[#374248] rounded-xl px-4 py-2.5 bg-white dark:bg-[#202c33] text-gray-900 dark:text-white outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Cliente</label>
                  <select value={editForm.clientId || ''} onChange={e => setEditForm({...editForm, clientId: e.target.value, equipment: ''})} className="w-full border border-gray-300 dark:border-[#374248] rounded-xl px-4 py-2.5 bg-white dark:bg-[#202c33] text-gray-900 dark:text-white outline-none">
                    <option value="">Seleccione un cliente...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Equipo o Sistema</label>
                  <select value={editForm.equipment || ''} onChange={e => setEditForm({...editForm, equipment: e.target.value})} disabled={!editForm.clientId} className="w-full border border-gray-300 dark:border-[#374248] rounded-xl px-4 py-2.5 bg-white dark:bg-[#202c33] text-gray-900 dark:text-white outline-none disabled:opacity-50">
                    <option value="">Seleccione un equipo...</option>
                    {equipments.filter(e => e.clientId === editForm.clientId).map(e => <option key={e.id} value={e.name}>{e.name} {e.brand ? `(${e.brand})` : ''}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Prioridad</label>
                  <div className="flex rounded-xl shadow-sm border border-gray-300 dark:border-[#374248] overflow-hidden">
                    {['Baja', 'Media', 'Alta'].map(p => (
                      <button key={p} type="button" onClick={() => setEditForm({...editForm, priority: p})} className={`flex-1 py-2 text-sm font-medium transition-colors ${editForm.priority === p ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 font-bold' : 'bg-white dark:bg-[#202c33] text-gray-700 hover:bg-gray-50'}`}>{p}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Reportado por (Nombre)</label>
                  <input type="text" value={editForm.reportedBy || ''} onChange={e => setEditForm({...editForm, reportedBy: e.target.value})} className="w-full border border-gray-300 dark:border-[#374248] rounded-xl px-4 py-2.5 bg-white dark:bg-[#202c33] text-gray-900 dark:text-white outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Técnico Asignado</label>
                  <select value={editForm.assignedUserId || ''} onChange={e => setEditForm({...editForm, assignedUserId: e.target.value})} className="w-full border border-gray-300 dark:border-[#374248] rounded-xl px-4 py-2.5 bg-white dark:bg-[#202c33] text-gray-900 dark:text-white outline-none">
                    <option value="">Dejar sin asignar...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name || u.username}</option>)}
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
