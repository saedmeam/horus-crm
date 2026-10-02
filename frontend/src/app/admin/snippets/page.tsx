"use client";
import { useEffect, useState } from 'react';
import { MessageSquarePlus, Trash2, Plus, UploadCloud } from 'lucide-react';

export default function SnippetsPage() {
  const [snippets, setSnippets] = useState<any[]>([]);
  const [newSnippetShortcut, setNewSnippetShortcut] = useState('');
  const [newSnippetText, setNewSnippetText] = useState('');
  const [newSnippetMediaUrl, setNewSnippetMediaUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // We still need to fetch and save the full settings object so we don't overwrite others
  const [fullSettings, setFullSettings] = useState<any>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}`) + '/api/settings', {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      if (res.ok) {
        const data = await res.json();
        setFullSettings(data);
        setSnippets(data.snippets || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (updatedSnippets: any[]) => {
    try {
      const payload = { ...fullSettings, snippets: updatedSnippets };
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}`) + '/api/settings', {
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

  const handleUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}`) + '/api/upload', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        setNewSnippetMediaUrl(data.url);
      } else {
        alert('Error al subir el archivo');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al subir el archivo');
    } finally {
      setIsUploading(false);
      e.target.value = ''; 
    }
  };

  const handleAddSnippet = () => {
    let shortcut = newSnippetShortcut.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const text = newSnippetText.trim();
    if (!shortcut) return;
    
    if (snippets.find(s => s.shortcut === shortcut)) {
      alert('Ya existe un snippet con este atajo');
      return;
    }
    
    const updated = [...snippets, { id: Date.now().toString(), shortcut, text, mediaUrl: newSnippetMediaUrl }];
    setSnippets(updated);
    setNewSnippetShortcut('');
    setNewSnippetText('');
    setNewSnippetMediaUrl('');
    saveSettings(updated);
  };

  const handleRemoveSnippet = (idToRemove: string) => {
    if(!confirm('¿Seguro que deseas eliminar esta respuesta rápida?')) return;
    const updated = snippets.filter(s => s.id !== idToRemove);
    setSnippets(updated);
    saveSettings(updated);
  };

  if (isLoading) return <div className="p-10 text-center text-gray-500">Cargando...</div>;

  return (
    <div className="max-w-4xl mx-auto w-full bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden text-gray-800">
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
        <div className="bg-blue-100 p-2 rounded-lg">
          <MessageSquarePlus className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">Respuestas Rápidas (Snippets)</h2>
          <p className="text-sm text-gray-500">Plantillas de mensajes para los agentes (usan escribiendo /atajo en el chat)</p>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-3 mb-6">
          {snippets.map((snippet) => (
            <div key={snippet.id} className="flex gap-4 items-start bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex-1">
                <span className="font-bold text-blue-600 font-mono text-sm block mb-1">/{snippet.shortcut}</span>
                {snippet.text && <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">{snippet.text}</p>}
                {snippet.mediaUrl && (
                  <a href={snippet.mediaUrl} target="_blank" className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                    📎 Archivo adjunto
                  </a>
                )}
              </div>
              <button 
                onClick={() => handleRemoveSnippet(snippet.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {snippets.length === 0 && (
            <div className="text-sm text-gray-400 italic p-4 bg-gray-50 rounded-xl text-center">
              No hay respuestas rápidas configuradas.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
          <div className="flex gap-2 items-center">
            <span className="font-bold text-blue-500">/</span>
            <input 
              type="text" 
              placeholder="atajo (ej: cuentas)" 
              value={newSnippetShortcut}
              onChange={(e) => setNewSnippetShortcut(e.target.value)}
              className="w-1/3 border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <textarea 
            placeholder="Escribe el texto de la respuesta (opcional si envías archivo)..." 
            value={newSnippetText}
            onChange={(e) => setNewSnippetText(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none"
          />
          <div className="flex items-center gap-3 justify-between">
            <div className="flex-1 flex items-center gap-2">
              <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
                <UploadCloud className="w-4 h-4" />
                {isUploading ? 'Subiendo...' : 'Adjuntar Archivo'}
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleUpload}
                  disabled={isUploading}
                />
              </label>
              {newSnippetMediaUrl && <span className="text-xs text-green-600 font-semibold flex items-center gap-1">✓ Archivo cargado</span>}
            </div>
            <button 
              onClick={handleAddSnippet}
              disabled={!newSnippetShortcut.trim() || (!newSnippetText.trim() && !newSnippetMediaUrl)}
              className="px-4 py-2 bg-blue-600 disabled:bg-gray-400 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Guardar Snippet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
