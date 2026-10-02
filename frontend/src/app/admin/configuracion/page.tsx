'use client';

import { useEffect, useState } from 'react';
import { Save, Key, Shield, Smartphone, Globe } from 'lucide-react';
import { showAlert } from '@/utils/alert';

export default function ConfiguracionAdminPage() {
  const [settings, setSettings] = useState({
    WHATSAPP_TOKEN: '',
    WHATSAPP_VERIFY_TOKEN: '',
    WABA_ID: '',
    DEFAULT_PHONE_NUMBER_ID: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/meta-settings`, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      if (res.ok) {
        const data = await res.json();
        setSettings({
          WHATSAPP_TOKEN: data.WHATSAPP_TOKEN || '',
          WHATSAPP_VERIFY_TOKEN: data.WHATSAPP_VERIFY_TOKEN || '',
          WABA_ID: data.WABA_ID || '',
          DEFAULT_PHONE_NUMBER_ID: data.DEFAULT_PHONE_NUMBER_ID || ''
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/meta-settings`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        showAlert('Configuraciones guardadas en la Base de Datos exitosamente.', 'success');
      }
    } catch (e) {
      console.error(e);
      showAlert('Error guardando configuraciones.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
          <Globe size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Configuración del Sistema (Tokens)</h1>
          <p className="text-gray-500 mt-1">Administra las credenciales de Meta directamente en la base de datos, sin tocar código.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 space-y-6">
          
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 border-b pb-2">
              <Key size={20} className="text-yellow-500"/> Credenciales de Acceso Meta
            </h3>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp Token (Token de acceso permanente)</label>
              <input 
                type="password" 
                value={settings.WHATSAPP_TOKEN} 
                onChange={e => setSettings({...settings, WHATSAPP_TOKEN: e.target.value})} 
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                placeholder="EAAT0mj..."
              />
              <p className="text-xs text-gray-400 mt-1">El token que te da Meta para poder enviar mensajes.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">WABA ID (Identificador de la cuenta de WhatsApp Business)</label>
              <input 
                type="text" 
                value={settings.WABA_ID} 
                onChange={e => setSettings({...settings, WABA_ID: e.target.value})} 
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                placeholder="Ej: 1406360574269503"
              />
              <p className="text-xs text-gray-400 mt-1">Necesario para leer y sincronizar el estado de tus plantillas oficiales.</p>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 border-b pb-2">
              <Shield size={20} className="text-green-500"/> Seguridad del Webhook
            </h3>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Verify Token (Token de Verificación Webhook)</label>
              <input 
                type="text" 
                value={settings.WHATSAPP_VERIFY_TOKEN} 
                onChange={e => setSettings({...settings, WHATSAPP_VERIFY_TOKEN: e.target.value})} 
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                placeholder="mi_token_secreto_horustech"
              />
              <p className="text-xs text-gray-400 mt-1">La contraseña secreta que pones en Meta para enlazar tu Webhook.</p>
            </div>
          </div>

        </div>

        <div className="p-4 bg-gray-50 border-t flex justify-end">
          <button 
            type="submit" 
            disabled={saving || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Guardando...' : 'Guardar Configuraciones'}
          </button>
        </div>
      </form>
    </div>
  );
}
