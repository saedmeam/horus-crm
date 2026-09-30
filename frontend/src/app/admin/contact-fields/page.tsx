"use client";
import { useEffect, useState } from 'react';
import { List, Trash2, Plus } from 'lucide-react';

export default function ContactFieldsPage() {
  const [fields, setFields] = useState<string[]>([]);
  const [newField, setNewField] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [fullSettings, setFullSettings] = useState<any>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/settings', {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      if (res.ok) {
        const data = await res.json();
        setFullSettings(data);
        setFields(data.customContactFields || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (updatedFields: string[]) => {
    try {
      const payload = { ...fullSettings, customContactFields: updatedFields };
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setFullSettings(payload);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddField = () => {
    const trimmed = newField.trim();
    if (!trimmed || fields.includes(trimmed)) return;
    const updated = [...fields, trimmed];
    setFields(updated);
    setNewField('');
    saveSettings(updated);
  };

  const handleRemoveField = (fieldToRemove: string) => {
    if(!confirm('¿Seguro que deseas eliminar este campo global?')) return;
    const updated = fields.filter(f => f !== fieldToRemove);
    setFields(updated);
    saveSettings(updated);
  };

  if (isLoading) return <div className="p-10 text-center text-gray-500">Cargando...</div>;

  return (
    <div className="max-w-4xl mx-auto w-full bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden text-gray-800">
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
        <div className="bg-teal-100 p-2 rounded-lg">
          <List className="w-6 h-6 text-teal-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">Estructura de Contactos (Campos Globales)</h2>
          <p className="text-sm text-gray-500">Define los campos personalizados que aparecerán automáticamente en TODOS los contactos del sistema.</p>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-3 mb-6">
          {fields.map((field) => (
            <div key={field} className="flex gap-2 items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="flex-1 font-semibold text-gray-700">{field}</span>
              <button 
                onClick={() => handleRemoveField(field)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar Campo Global"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {fields.length === 0 && (
            <div className="text-sm text-gray-400 italic p-4 bg-gray-50 rounded-xl text-center">
              No hay campos globales definidos.
            </div>
          )}
        </div>

        <div className="flex gap-2 items-center bg-teal-50/50 p-4 rounded-xl border border-teal-100">
          <input 
            type="text" 
            placeholder="Nuevo campo global (ej: RFC o Fecha de Nacimiento)" 
            value={newField}
            onChange={(e) => setNewField(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddField()}
            className="flex-1 border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
          <button 
            onClick={handleAddField}
            disabled={!newField.trim()}
            className="px-4 py-2 bg-teal-600 disabled:bg-gray-400 hover:bg-teal-700 text-white rounded-lg transition-colors font-semibold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Agregar Campo
          </button>
        </div>
      </div>
    </div>
  );
}
