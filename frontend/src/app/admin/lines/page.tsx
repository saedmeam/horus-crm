"use client";
import { useState, useEffect } from 'react';
import { Plus, Trash2, PhoneCall } from 'lucide-react';

export default function LinesPage() {
  const [lines, setLines] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phoneNumberId: ''
  });

  const fetchLines = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}`}/api/lines`, {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    if (res.ok) setLines(await res.json());
  };

  useEffect(() => {
    fetchLines();
  }, []);

  const handleCreateLine = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}`}/api/lines`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setShowModal(false);
      setFormData({ name: '', phoneNumberId: '' });
      fetchLines();
    } else {
      const data = await res.json();
      alert(data.error || 'Error al crear la línea');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este canal? Se perderá la vinculación.')) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/lines/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    if (res.ok) fetchLines();
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Canales de WhatsApp</h2>
          <p className="text-sm text-gray-500 mt-1">Registra y administra los números de WhatsApp conectados a Meta.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Registrar Canal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lines.map(line => (
          <div key={line.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
              <button onClick={() => handleDelete(line.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
            
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
              <PhoneCall size={24} />
            </div>
            
            <h3 className="text-lg font-bold text-gray-800 mb-1">{line.name}</h3>
            <p className="text-sm text-gray-500 font-mono break-all mb-4 flex-1">
              ID: {line.phoneNumberId}
            </p>
            
            <div className="flex items-center gap-2 pt-4 border-t border-gray-100 mt-auto">
              <span className={`w-2.5 h-2.5 rounded-full ${line.active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              <span className="text-sm font-medium text-gray-600">{line.active ? 'Canal Activo' : 'Inactivo'}</span>
            </div>
          </div>
        ))}
        {lines.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            No hay canales de WhatsApp registrados.
          </div>
        )}
      </div>

      {/* Modal Crear Canal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">Registrar Nuevo Canal</h3>
            </div>
            <form onSubmit={handleCreateLine} className="p-6 space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Identificativo</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-3 py-2 border rounded-lg text-black focus:ring-2 focus:ring-green-500 outline-none" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="Ej: Soporte Técnico, Ventas 2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number ID (Meta)</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-3 py-2 border rounded-lg text-black focus:ring-2 focus:ring-green-500 outline-none" 
                  value={formData.phoneNumberId} 
                  onChange={e => setFormData({...formData, phoneNumberId: e.target.value})} 
                  placeholder="Ej: 1350864618112079"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Obtén este ID desde tu panel de desarrollo de Meta for Developers, en la sección de WhatsApp &gt; API Setup.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
                  Registrar Canal
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
