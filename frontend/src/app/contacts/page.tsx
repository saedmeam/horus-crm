"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MainSidebar from '@/components/MainSidebar';
import { Users, Search, Edit2, Phone, X, Save, Plus, Trash2 } from 'lucide-react';

export default function ContactsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  
  // Edit Modal State
  const [editingContact, setEditingContact] = useState<any>(null);
  const [editForm, setEditForm] = useState({ 
    name: '', 
    email: '', 
    city: '', 
    institution: '', 
    customFields: {} as Record<string, string> 
  });
  
  // State for adding a new custom field on the fly
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  
  const [globalFields, setGlobalFields] = useState<string[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(localStorage.getItem('user') || '{}'));
    setDarkMode(document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark');
    fetchContacts(token);
    fetchGlobalFields(token);
  }, [router]);

  const fetchGlobalFields = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}`}/api/settings`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        const data = await res.json();
        setGlobalFields(data.customContactFields || []);
      }
    } catch (e) {
      console.error(e);
    }
  };


  const fetchContacts = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}`}/api/contacts`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        setContacts(await res.json());
      }
    } catch (e) {
      console.error('Error fetching contacts:', e);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEdit = (contact: any) => {
    setEditingContact(contact);
    setEditForm({
      name: contact.name || '',
      email: contact.email || '',
      city: contact.city || '',
      institution: contact.institution || '',
      customFields: (() => {
        const existing = typeof contact.customFields === 'string' ? JSON.parse(contact.customFields || '{}') : (contact.customFields || {});
        // Merge with global fields (so empty ones show up)
        const merged = { ...existing };
        globalFields.forEach(gf => {
          if (!(gf in merged)) merged[gf] = '';
        });
        return merged;
      })()
    });
    setNewFieldKey('');
    setNewFieldValue('');
  };

  const handleAddCustomField = () => {
    if (!newFieldKey.trim()) return;
    setEditForm({
      ...editForm,
      customFields: {
        ...editForm.customFields,
        [newFieldKey.trim()]: newFieldValue.trim()
      }
    });
    setNewFieldKey('');
    setNewFieldValue('');
  };

  const handleRemoveCustomField = (keyToRemove: string) => {
    const updatedFields = { ...editForm.customFields };
    delete updatedFields[keyToRemove];
    setEditForm({ ...editForm, customFields: updatedFields });
  };

  const handleCustomFieldChange = (key: string, value: string) => {
    setEditForm({
      ...editForm,
      customFields: {
        ...editForm.customFields,
        [key]: value
      }
    });
  };

  const saveContact = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/contacts/${editingContact.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setEditingContact(null);
        fetchContacts(localStorage.getItem('token')!);
      }
    } catch (e) {
      console.error('Error saving contact:', e);
    }
  };

  if (!user) return null;

  return (
    <div className={(darkMode ? 'dark' : '') + ' flex h-screen w-full overflow-hidden'}>
      <MainSidebar user={user} />
      
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-[#0b141a] transition-colors duration-200 overflow-y-auto relative">
        <div className="h-16 bg-white dark:bg-[#202c33] border-b border-gray-200 dark:border-[#222d34] flex items-center px-6 shrink-0 z-10 shadow-sm sticky top-0 justify-between">
          <h1 className="text-xl font-bold text-gray-800 dark:text-[#e9edef] flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600 dark:text-[#00a884]" />
            Directorio de Contactos
          </h1>
        </div>

        <div className="p-8 max-w-6xl mx-auto w-full">
          <div className="bg-white dark:bg-[#202c33] border border-gray-200 dark:border-[#374248] rounded-2xl shadow-sm overflow-hidden">
            
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 dark:border-[#2a3942] bg-gray-50/50 dark:bg-[#2a3942]/20">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar por nombre, teléfono o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-[#374248] bg-white dark:bg-[#111b21] rounded-xl text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500 transition-colors text-sm"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#2a3942] text-gray-500 dark:text-[#aebac1] text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">Contacto</th>
                    <th className="px-6 py-4 font-semibold">Teléfono</th>
                    <th className="px-6 py-4 font-semibold">Ciudad</th>
                    <th className="px-6 py-4 font-semibold">Institución</th>
                    <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#2a3942]">
                  {filteredContacts.map(contact => (
                    <tr key={contact.id} className="hover:bg-gray-50/80 dark:hover:bg-[#2a3942]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800 dark:text-gray-200">{contact.name || 'Sin nombre'}</div>
                        <div className="text-xs text-gray-500 dark:text-[#8696a0]">{contact.email || 'Sin correo'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-[#d1d7db] text-sm">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {contact.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-[#d1d7db]">
                        {contact.city || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-[#d1d7db]">
                        {contact.institution || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => openEdit(contact)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Editar Contacto"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredContacts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-[#8696a0]">
                        No se encontraron contactos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {editingContact && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm transition-all overflow-y-auto">
            <div className="bg-white dark:bg-[#1f2c33] w-full max-w-xl rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-[#2a3942] my-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-blue-600 dark:text-[#00a884]" />
                  Editar Contacto
                </h3>
                <button onClick={() => setEditingContact(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-[#aebac1] mb-1.5">Nombre</label>
                  <input 
                    type="text" 
                    value={editForm.name} 
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full border border-gray-300 dark:border-[#374248] bg-gray-50 dark:bg-[#111b21] rounded-xl p-3 text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-[#aebac1] mb-1.5">Email</label>
                  <input 
                    type="email" 
                    value={editForm.email} 
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full border border-gray-300 dark:border-[#374248] bg-gray-50 dark:bg-[#111b21] rounded-xl p-3 text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-[#aebac1] mb-1.5">Ciudad</label>
                  <input 
                    type="text" 
                    value={editForm.city} 
                    onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                    className="w-full border border-gray-300 dark:border-[#374248] bg-gray-50 dark:bg-[#111b21] rounded-xl p-3 text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-[#aebac1] mb-1.5">Institución</label>
                  <input 
                    type="text" 
                    value={editForm.institution} 
                    onChange={(e) => setEditForm({...editForm, institution: e.target.value})}
                    className="w-full border border-gray-300 dark:border-[#374248] bg-gray-50 dark:bg-[#111b21] rounded-xl p-3 text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Custom Fields Section */}
              <div className="mt-6 border-t border-gray-100 dark:border-[#2a3942] pt-6">
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4">Campos Personalizados (Variables)</h4>
                
                <div className="space-y-3 mb-4">
                  {Object.entries(editForm.customFields).map(([key, value]) => (
                    <div key={key} className="flex gap-2 items-center">
                      <div className="w-1/3 bg-gray-100 dark:bg-[#2a3942] text-gray-600 dark:text-[#aebac1] px-3 py-2 rounded-lg text-sm font-semibold border border-transparent truncate" title={key}>
                        {key}
                      </div>
                      <input 
                        type="text" 
                        value={value} 
                        onChange={(e) => handleCustomFieldChange(key, e.target.value)}
                        className="flex-1 border border-gray-300 dark:border-[#374248] bg-gray-50 dark:bg-[#111b21] rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500 text-sm"
                        placeholder="Valor..."
                      />
                      
                    </div>
                  ))}
                  
                  {Object.keys(editForm.customFields).length === 0 && (
                    <p className="text-sm text-gray-400 dark:text-[#8696a0] italic">No hay campos adicionales.</p>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => setEditingContact(null)} className="px-5 py-2.5 rounded-xl text-gray-600 dark:text-[#aebac1] hover:bg-gray-100 dark:hover:bg-[#2a3942] font-semibold transition-colors">
                  Cancelar
                </button>
                <button onClick={saveContact} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-md flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
