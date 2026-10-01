'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MainSidebar from '@/components/MainSidebar';
import { AlarmClock, Plus, Check, Search, Calendar, X } from 'lucide-react';
import io, { Socket } from 'socket.io-client';

export default function RecordatoriosPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [reminders, setReminders] = useState<any[]>([]);
  const [activeAlert, setActiveAlert] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Form state
  const [selectedContactId, setSelectedContactId] = useState('');
  const [reminderNotes, setReminderNotes] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData || '{}'));
    
    // Check dark mode preference
    const isDark = document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
    setDarkMode(isDark);

    fetchReminders();
    fetchContacts();

    const socket = io('http://localhost:3001');
    socket.on('new_reminder', (rem: any) => {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      if (rem.userId === u.id) {
        fetchReminders();
      }
    });

    return () => { socket.disconnect(); };
  }, []);


  

  const fetchReminders = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/reminders`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
      .then(res => res.json())
      .then(data => setReminders(data))
      .catch(e => console.error(e));
  };

  const fetchContacts = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/contacts`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
      .then(res => res.json())
      .then(data => setContacts(data))
      .catch(e => console.error(e));
  };

  const handleSaveReminder = async () => {
    if (!selectedContactId || !reminderDate || !reminderTime || !reminderNotes) return;
    try {
      const scheduledFor = new Date(`${reminderDate}T${reminderTime}`).toISOString();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/reminders`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: selectedContactId,
          scheduledFor,
          notes: reminderNotes
        })
      });
      if (res.ok) {
        setShowModal(false);
        setReminderNotes('');
        setReminderDate('');
        setReminderTime('');
        setSelectedContactId('');
        fetchReminders();
      }
    } catch (e) {
      console.error(e);
      alert('Error guardando recordatorio');
    }
  };

  const handleCompleteReminder = async (id: string) => {
    try {
      await fetch(`http://localhost:3001/api/reminders/${id}/complete`, {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      fetchReminders();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredContacts = contacts.filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.phone || '').includes(searchTerm)
  );

  return (
    <div className={(darkMode ? 'dark' : '') + ' flex h-screen w-full overflow-hidden'}>
      <MainSidebar user={user} />
      
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-[#0b141a] transition-colors duration-200 h-full overflow-hidden">
        {/* Header */}
        <div className="h-16 bg-white dark:bg-[#202c33] border-b border-gray-200 dark:border-[#222d34] flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
          <h1 className="text-xl font-bold text-gray-800 dark:text-[#e9edef] flex items-center gap-2">
            <AlarmClock className="w-6 h-6 text-blue-600 dark:text-[#00a884]" />
            Mis Recordatorios
          </h1>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-[#00a884] dark:hover:bg-[#008f6f] text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Crear Recordatorio
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-6 relative">
          {reminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-[#8696a0]">
              <Calendar className="w-16 h-16 mb-4 opacity-50" />
              <h2 className="text-xl font-semibold mb-2">No tienes recordatorios pendientes</h2>
              <p>Haz clic en "Crear Recordatorio" para programar uno nuevo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
              {reminders.map(rem => (
                <div key={rem.id} className="bg-white dark:bg-[#202c33] border border-gray-200 dark:border-[#374248] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 dark:bg-[#00a884]"></div>
                  
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg truncate pr-8">
                      {rem.contact?.name || rem.contact?.phone || 'Cliente'}
                    </h3>
                    <button 
                      onClick={() => handleCompleteReminder(rem.id)}
                      title="Marcar como completado"
                      className="text-gray-300 hover:text-green-500 bg-gray-50 dark:bg-[#2a3942] hover:bg-green-50 dark:hover:bg-green-900/30 p-2 rounded-full transition-colors absolute top-4 right-4"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <p className="text-gray-600 dark:text-[#aebac1] mb-4 text-sm line-clamp-3 min-h-[60px]">
                    {rem.notes}
                  </p>
                  
                  <div className="flex items-center gap-2 text-sm font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-lg inline-flex">
                    <Calendar className="w-4 h-4" />
                    {new Date(rem.scheduledFor).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      
      {/* Alerta Activa de Recordatorio */}
      {activeAlert && (
        <div className="fixed top-6 right-6 bg-white dark:bg-[#1f2c33] border-l-4 border-orange-500 rounded-xl shadow-2xl z-[200] w-80 overflow-hidden animate-bounce">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-2 text-orange-600 dark:text-orange-400">
              <AlarmClock className="w-6 h-6 animate-pulse" />
              <h3 className="font-bold text-lg">¡Recordatorio!</h3>
            </div>
            <p className="font-bold text-gray-800 dark:text-gray-100">{activeAlert.contact?.name || activeAlert.contact?.phone}</p>
            <p className="text-sm text-gray-600 dark:text-[#aebac1] mt-1 line-clamp-3">{activeAlert.notes}</p>
            
            <div className="mt-4 flex gap-2">
              <button 
                onClick={() => {
                  router.push('/');
                }} 
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-1.5 rounded-lg font-bold text-sm transition-colors"
              >
                Ir a los Chats
              </button>
              <button 
                onClick={() => {
                  handleCompleteReminder(activeAlert.id);
                  setActiveAlert(null);
                }} 
                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-[#2a3942] dark:hover:bg-[#374248] text-gray-700 dark:text-gray-200 py-1.5 rounded-lg font-bold text-sm transition-colors"
              >
                Completar
              </button>
              <button 
                onClick={() => setActiveAlert(null)} 
                className="px-3 bg-gray-100 hover:bg-gray-200 dark:bg-[#2a3942] dark:hover:bg-[#374248] text-gray-700 dark:text-gray-200 rounded-lg transition-colors flex items-center justify-center"
                title="Cerrar alerta"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1f2c33] w-full max-w-md rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-[#2a3942] flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <AlarmClock className="w-5 h-5 text-blue-600 dark:text-[#00a884]" />
                Crear Recordatorio
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto pr-2 space-y-4">
              {/* Contact Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-[#aebac1] mb-1.5">Buscar Contacto</label>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Escribe un nombre o número..."
                    className="w-full border border-gray-300 dark:border-[#374248] bg-gray-50 dark:bg-[#111b21] rounded-xl p-2 pl-9 text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-[#374248] rounded-xl bg-white dark:bg-[#111b21]">
                  {filteredContacts.length === 0 ? (
                    <p className="p-3 text-sm text-center text-gray-500">No se encontraron contactos</p>
                  ) : (
                    filteredContacts.map(c => (
                      <div 
                        key={c.id} 
                        onClick={() => setSelectedContactId(c.id)}
                        className={`p-3 cursor-pointer text-sm border-b border-gray-100 dark:border-[#2a3942] last:border-0 hover:bg-gray-50 dark:hover:bg-[#2a3942] transition-colors ${selectedContactId === c.id ? 'bg-blue-50 dark:bg-[#2a3942] font-semibold text-blue-600 dark:text-[#00a884]' : 'text-gray-700 dark:text-gray-200'}`}
                      >
                        {c.name || 'Sin Nombre'} ({c.phone})
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-[#aebac1] mb-1.5">Descripción / Notas</label>
                <textarea 
                  value={reminderNotes} 
                  onChange={(e) => setReminderNotes(e.target.value)}
                  className="w-full border border-gray-300 dark:border-[#374248] bg-gray-50 dark:bg-[#111b21] rounded-xl p-3 text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500 min-h-[100px] resize-none"
                  placeholder="Ej: Seguimiento de propuesta enviada..."
                ></textarea>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-[#aebac1] mb-1.5">Fecha</label>
                  <input 
                    type="date" 
                    value={reminderDate} 
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full border border-gray-300 dark:border-[#374248] bg-gray-50 dark:bg-[#111b21] rounded-xl p-3 text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-[#aebac1] mb-1.5">Hora</label>
                  <input 
                    type="time" 
                    value={reminderTime} 
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full border border-gray-300 dark:border-[#374248] bg-gray-50 dark:bg-[#111b21] rounded-xl p-3 text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-[#374248] flex justify-end gap-3 shrink-0">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-gray-600 dark:text-[#aebac1] hover:bg-gray-100 dark:hover:bg-[#2a3942] font-semibold transition-colors">
                Cancelar
              </button>
              <button onClick={handleSaveReminder} disabled={!selectedContactId || !reminderNotes || !reminderDate || !reminderTime} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:bg-[#00a884] dark:hover:bg-[#008f6f] dark:disabled:bg-[#00a884]/50 text-white font-semibold transition-colors shadow-md flex items-center gap-2">
                Crear Recordatorio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
