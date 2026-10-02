'use client';

import React, { useEffect, useState } from 'react';
import { Save, Plus, Trash2, Send, CheckCircle, Clock, XCircle, FileText, RefreshCw, Brackets, Edit2, AlertTriangle, ArrowRight, Check } from 'lucide-react';
import { showAlert } from '@/utils/alert';

export default function PlantillasAdminPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<{id: string, name: string} | null>(null);

  const [form, setForm] = useState({
    name: '',
    category: 'UTILITY',
    language: 'es',
    bodyText: '',
    submitToMeta: false
  });

  const [varCount, setVarCount] = useState(0);

  // Wizard States
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0); // 0-indexed variable step
  const [wizardExamples, setWizardExamples] = useState<string[]>([]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Update var count when bodyText changes
  useEffect(() => {
    const matches = form.bodyText.match(/\{\{(\d+)\}\}/g) || [];
    let maxNum = 0;
    matches.forEach(m => {
      const num = parseInt(m.replace(/\D/g, ''));
      if (num > maxNum) maxNum = num;
    });
    setVarCount(maxNum);
  }, [form.bodyText]);

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/templates`, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      if (res.ok) setTemplates(await res.json());
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/templates/sync`, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      if (res.ok) {
        showAlert('Plantillas sincronizadas con Meta exitosamente.', 'success');
        fetchTemplates();
      } else {
        const data = await res.json();
        showAlert(data.error || 'Error al sincronizar con Meta', 'error');
      }
    } catch (e) {
      showAlert('Error de conexión al sincronizar', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const addVariable = () => {
    const nextNum = varCount + 1;
    setForm({...form, bodyText: form.bodyText + " {{" + nextNum + "}}"});
  };

  const openNewModal = () => {
    setEditingId(null);
    setForm({ name: '', category: 'UTILITY', language: 'es', bodyText: '', submitToMeta: false });
    setShowModal(true);
  };

  const openEditModal = (t: any) => {
    setEditingId(t.id);
    setForm({
      name: t.name,
      category: t.category,
      language: t.language,
      bodyText: t.bodyText,
      submitToMeta: false
    });
    setShowModal(true);
  };

  const executeDelete = async () => {
    if (!templateToDelete) return;
    
    const id = templateToDelete.id;
    setTemplateToDelete(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/templates/` + id, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });

      if (res.ok) {
        showAlert('Plantilla eliminada exitosamente', 'success');
        fetchTemplates();
      } else {
        showAlert('Error al eliminar', 'error');
      }
    } catch (e) {
      showAlert('Error de conexión', 'error');
    }
  };

  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();

    if (form.submitToMeta && varCount > 0) {
      // Abre el Wizard si hay variables y se enviará a Meta
      setWizardExamples(Array(varCount).fill(''));
      setWizardStep(0);
      setShowWizard(true);
    } else {
      // Guarda directamente si no hay variables o es solo borrador
      executeSubmit([]);
    }
  };

  const handleWizardNext = () => {
    if (!wizardExamples[wizardStep].trim()) {
      showAlert('Debes ingresar un valor de ejemplo para continuar.', 'error');
      return;
    }
    
    if (wizardStep < varCount - 1) {
      setWizardStep(prev => prev + 1);
    } else {
      setShowWizard(false);
      executeSubmit(wizardExamples);
    }
  };

  const executeSubmit = async (finalExamples: string[]) => {
    const varsArray = Array.from({length: varCount}, (_, i) => String(i + 1));

    const url = editingId 
      ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/templates/` + editingId 
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/templates`;
    
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({
          ...form,
          variables: JSON.stringify(varsArray),
          examples: JSON.stringify(finalExamples)
        })
      });

      if (res.ok) {
        setShowModal(false);
        setForm({ name: '', category: 'UTILITY', language: 'es', bodyText: '', submitToMeta: false });
        showAlert(editingId ? 'Plantilla actualizada exitosamente' : 'Plantilla creada exitosamente', 'success');
        fetchTemplates();
      } else {
        const data = await res.json();
        showAlert('Error: ' + JSON.stringify(data.error), 'error');
      }
    } catch (e) {
      console.error(e);
      showAlert('Error guardando plantilla', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'APPROVED': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><CheckCircle size={14}/> Aprobada</span>;
      case 'PENDING': return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><Clock size={14}/> En Revisión</span>;
      case 'REJECTED': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><XCircle size={14}/> Rechazada</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><FileText size={14}/> Solo Local</span>;
    }
  };

  const renderWizardText = () => {
    // Primero, reemplazamos todas las variables {{x}} por su ejemplo actual,
    // EXCEPTO la que estamos editando en este momento (wizardStep).
    let textToRender = form.bodyText;
    
    // Reemplazar las variables que NO son el paso actual
    for (let i = 0; i < varCount; i++) {
      if (i !== wizardStep && wizardExamples[i]) {
        textToRender = textToRender.replace(new RegExp(`\\{\\{\$\{i + 1\}\}\\}`, 'g'), wizardExamples[i]);
      }
    }

    const target = `{{${wizardStep + 1}}}`;
    const parts = textToRender.split(target);
    
    return (
      <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl text-gray-700 whitespace-pre-wrap leading-relaxed shadow-inner font-medium text-lg">
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            {part}
            {i < parts.length - 1 && (
              <span className="bg-yellow-300 text-yellow-900 px-2 py-0.5 rounded shadow-sm transition-all duration-200 inline-block min-w-[30px] text-center">
                {wizardExamples[wizardStep] || target}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Plantillas Meta (WABA)</h1>
          <p className="text-gray-500 mt-1">Crea, edita y gestiona plantillas aprobadas por Meta.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleSync} 
            disabled={syncing}
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={20} className={syncing ? "animate-spin" : ""} /> Sincronizar
          </button>
          <button onClick={openNewModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Plus size={20} /> Nueva Plantilla
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? <p className="text-gray-400">Cargando...</p> : templates.map(t => (
          <div key={t.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3 group hover:border-blue-200 transition-colors">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg text-gray-800">{t.name}</h3>
              <div className="flex items-center gap-2">
                {getStatusBadge(t.status)}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-2">
                  <button onClick={() => openEditModal(t)} className="text-gray-400 hover:text-blue-600 p-1 bg-gray-50 rounded"><Edit2 size={16}/></button>
                  <button onClick={() => setTemplateToDelete({id: t.id, name: t.name})} className="text-gray-400 hover:text-red-600 p-1 bg-gray-50 rounded"><Trash2 size={16}/></button>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap">{t.bodyText}</p>
            <div className="flex gap-2 text-xs text-gray-500">
              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">{t.category}</span>
              <span className="bg-gray-100 px-2 py-1 rounded">{t.language}</span>
              {JSON.parse(t.variables || '[]').length > 0 && (
                <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100 font-mono">
                  {JSON.parse(t.variables).map((v: string) => "{{" + v + "}}").join(', ')}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {templateToDelete && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col scale-in-center">
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">¿Eliminar Plantilla?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Estás a punto de eliminar la plantilla <span className="font-bold text-gray-700">"{templateToDelete.name}"</span>. También se enviará la orden a Meta para que la borre permanentemente de tu cuenta.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setTemplateToDelete(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={executeDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WIZARD Flotante tipo Respond.io */}
      {showWizard && (
        <div className="fixed inset-0 bg-gray-900/80 z-[70] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-gray-100 bg-white">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-extrabold text-2xl text-gray-800">Valores de Ejemplo</h3>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                  Paso {wizardStep + 1} de {varCount}
                </span>
              </div>
              <p className="text-gray-500">
                Para que Meta apruebe esta plantilla, necesitamos un ejemplo real para el metadato resaltado.
              </p>
            </div>
            
            <div className="p-8 bg-gray-50/50">
              {renderWizardText()}
              
              <div className="mt-8 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="bg-yellow-300 text-yellow-900 px-2 py-0.5 rounded shadow-sm text-base">
                    {`{{${wizardStep + 1}}}`}
                  </span>
                  ¿Qué texto va aquí?
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="Ej: Juan Pérez, Impresora 3D, etc."
                  value={wizardExamples[wizardStep] || ''}
                  onChange={(e) => {
                    const next = [...wizardExamples];
                    next[wizardStep] = e.target.value;
                    setWizardExamples(next);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleWizardNext();
                    }
                  }}
                  className="w-full px-4 py-3 text-lg border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setShowWizard(false)} 
                className="px-6 py-2.5 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleWizardNext} 
                className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20 flex items-center gap-2"
              >
                {wizardStep < varCount - 1 ? (
                  <>Siguiente <ArrowRight size={18} /></>
                ) : (
                  <>Finalizar y Enviar <Check size={18} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Creación/Edición Base */}
      {showModal && !showWizard && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">{editingId ? 'Editar Plantilla' : 'Crear Plantilla'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><XCircle size={20}/></button>
            </div>
            <form onSubmit={handleSaveClick} className="p-6 overflow-y-auto space-y-4">
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre (ej: promo_verano)</label>
                <input required type="text" value={form.name} readOnly={!!editingId} onChange={e => setForm({...form, name: e.target.value.toLowerCase()})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${editingId ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`} />
                {editingId && <p className="text-xs text-gray-500 mt-1">El nombre no se puede cambiar en Meta una vez creado.</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Categoría</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="MARKETING">Marketing</option>
                    <option value="UTILITY">Utilidad (Recomendada)</option>
                    <option value="AUTHENTICATION">Autenticación</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Idioma</label>
                  <input type="text" value={form.language} onChange={e => setForm({...form, language: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-semibold text-gray-700">Mensaje de la Plantilla</label>
                  <button 
                    type="button" 
                    onClick={addVariable}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-1 px-2 rounded flex items-center gap-1 transition-colors"
                  >
                    <Brackets size={14} /> Agregar Variable {"{{x}}"}
                  </button>
                </div>
                <textarea required rows={5} value={form.bodyText} onChange={e => setForm({...form, bodyText: e.target.value})} placeholder="Hola {{1}}, tu pedido {{2}} está listo." className="w-full px-3 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div className="border-t pt-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.submitToMeta} onChange={e => setForm({...form, submitToMeta: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm font-semibold text-gray-800">{editingId ? 'Re-enviar para aprobación a Meta' : 'Solicitar aprobación a Meta ahora mismo'}</span>
                </label>
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                <Save size={18} /> {editingId ? 'Actualizar Plantilla' : 'Guardar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
