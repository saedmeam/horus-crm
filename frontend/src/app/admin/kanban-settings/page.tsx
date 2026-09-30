"use client";
import { useEffect, useState } from 'react';
import { LayoutDashboard, Trash2, Plus } from 'lucide-react';

export default function KanbanSettingsPage() {
  const [stages, setStages] = useState<any[]>([]);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#3b82f6');
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
        setStages(data.pipelineStages || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (updatedStages: any[]) => {
    try {
      const payload = { ...fullSettings, pipelineStages: updatedStages };
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

  const handleAddStage = () => {
    const trimmed = newStageName.trim();
    if (!trimmed) return;
    const id = trimmed.toUpperCase().replace(/\\s+/g, '_').normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
    if (stages.find(s => s.id === id)) {
      alert('Ya existe una etapa similar');
      return;
    }
    const updated = [...stages, { id, name: trimmed, color: newStageColor }];
    setStages(updated);
    setNewStageName('');
    saveSettings(updated);
  };

  const handleRemoveStage = (idToRemove: string) => {
    if(!confirm('¿Seguro que deseas eliminar esta etapa del Embudo? Las conversaciones en esta etapa podrían ocultarse.')) return;
    const updated = stages.filter(s => s.id !== idToRemove);
    setStages(updated);
    saveSettings(updated);
  };

  if (isLoading) return <div className="p-10 text-center text-gray-500">Cargando...</div>;

  return (
    <div className="max-w-4xl mx-auto w-full bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden text-gray-800">
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
        <div className="bg-indigo-100 p-2 rounded-lg">
          <LayoutDashboard className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">Etapas del Embudo (Kanban)</h2>
          <p className="text-sm text-gray-500">Personaliza las columnas de tu embudo de ventas.</p>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-3 mb-6">
          {stages.map((stage) => (
            <div key={stage.id} className="flex gap-4 items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: stage.color }}></div>
              <span className="flex-1 font-semibold text-gray-700">{stage.name}</span>
              <span className="text-xs text-gray-400 font-mono">ID: {stage.id}</span>
              <button 
                onClick={() => handleRemoveStage(stage.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar Etapa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {stages.length === 0 && (
            <div className="text-sm text-gray-400 italic p-4 bg-gray-50 rounded-xl text-center">
              No hay etapas configuradas.
            </div>
          )}
        </div>

        <div className="flex gap-2 items-center bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
          <input 
            type="color" 
            value={newStageColor}
            onChange={(e) => setNewStageColor(e.target.value)}
            className="w-10 h-10 rounded border-0 cursor-pointer p-0 bg-transparent"
          />
          <input 
            type="text" 
            placeholder="Nueva etapa (ej: Pendiente de Pago)" 
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
            className="flex-1 border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
          <button 
            onClick={handleAddStage}
            disabled={!newStageName.trim()}
            className="px-4 py-2 bg-indigo-600 disabled:bg-gray-400 hover:bg-indigo-700 text-white rounded-lg transition-colors font-semibold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Agregar Etapa
          </button>
        </div>
      </div>
    </div>
  );
}
