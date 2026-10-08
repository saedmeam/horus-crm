'use client';

import { useEffect, useState } from 'react';
import { Save, Key, Shield, Globe, Link, Copy } from 'lucide-react';
import { showAlert } from '@/utils/alert';

export default function ConfiguracionAdminPage() {
  const [settings, setSettings] = useState({
    WHATSAPP_TOKEN: '',
    WABA_ID: '',
    WHATSAPP_VERIFY_TOKEN: '',
    NGROK_URL: '',
    NGROK_AUTHTOKEN: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
  const webhookUrl = `${API_URL}/webhook/whatsapp`;

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/meta-settings`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } });
      if (res.ok) {
        const data = await res.json();
        setSettings({
          WHATSAPP_TOKEN: data.WHATSAPP_TOKEN || '',
          WABA_ID: data.WABA_ID || '',
          WHATSAPP_VERIFY_TOKEN: data.WHATSAPP_VERIFY_TOKEN || '',
          NGROK_URL: data.NGROK_URL || '',
          NGROK_AUTHTOKEN: data.NGROK_AUTHTOKEN || ''
        });
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  
  

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/meta-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify(settings)
      });
      if (res.ok) showAlert('Configuraciones guardadas correctamente.', 'success');
      else showAlert('Error guardando configuraciones.', 'error');
    } catch (e) { console.error(e); showAlert('Error guardando configuraciones.', 'error'); } finally { setSaving(false); }
  };

  const copyWebhook = () => {
    try { navigator.clipboard?.writeText(webhookUrl); } catch (e) {}
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const inputClass = 'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm text-gray-800';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Globe size={32} /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Configuración de Meta (WhatsApp Cloud API)</h1>
          <p className="text-gray-500 mt-1">Credenciales globales. Si un canal no tiene su propio WABA ID o Token, se usan estos.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 border-b pb-2"><Link size={20} className="text-purple-500" /> URL del Webhook (pégala en Meta)</h3>
        <p className="text-sm text-gray-500 mt-3">Esta es la URL que debes poner en Meta (developers.facebook.com → tu app → WhatsApp → Configuración → Webhook) para RECIBIR mensajes.</p>
        <div className="flex items-center gap-2 mt-3">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-mono text-sm text-gray-800 break-all">{webhookUrl}</div>
          <button type="button" onClick={copyWebhook} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold flex items-center gap-1 transition-colors"><Copy size={16} /> {copied ? 'Copiado' : 'Copiar'}</button>
        </div>
        <p className="text-xs text-gray-400 mt-2">El campo "Verify token" de Meta debe coincidir con el "Token de Verificación" de abajo.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 border-b pb-2"><Key size={20} className="text-yellow-500" /> Credenciales de Acceso</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp Token (Token de acceso)</label>
              <input type="password" value={settings.WHATSAPP_TOKEN} onChange={e => setSettings({ ...settings, WHATSAPP_TOKEN: e.target.value })} className={inputClass} placeholder="EAAT0mj..." />
              <p className="text-xs text-gray-400 mt-1">Token de acceso global. Lo obtienes en developers.facebook.com → tu app → WhatsApp → API Setup.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">WABA ID (Identificador de la cuenta de WhatsApp Business)</label>
              <input type="text" value={settings.WABA_ID} onChange={e => setSettings({ ...settings, WABA_ID: e.target.value })} className={inputClass} placeholder="Ej: 1406360574269503" />
              <p className="text-xs text-gray-400 mt-1">ID global de la cuenta. Se usa si un canal no tiene su propio WABA ID.</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 border-b pb-2"><Shield size={20} className="text-green-500" /> Seguridad del Webhook</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Token de Verificación (Verify Token)</label>
              <input type="text" value={settings.WHATSAPP_VERIFY_TOKEN} onChange={e => setSettings({ ...settings, WHATSAPP_VERIFY_TOKEN: e.target.value })} className={inputClass} placeholder="mi_token_secreto_horustech" />
              <p className="text-xs text-gray-400 mt-1">Debe coincidir con el "Verify token" que pones en Meta al configurar el webhook.</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 border-b pb-2"><Globe size={20} className="text-purple-500" /> Ngrok (Túnel)</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">URL de Ngrok</label>
              <input type="text" value={settings.NGROK_URL} onChange={e => setSettings({ ...settings, NGROK_URL: e.target.value })} className={inputClass} placeholder="https://knee-eclair-agnostic.ngrok-free.dev" />
              <p className="text-xs text-gray-400 mt-1">URL pública del túnel para pruebas sin dominio.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Token de Ngrok (Authtoken)</label>
              <input type="password" value={settings.NGROK_AUTHTOKEN} onChange={e => setSettings({ ...settings, NGROK_AUTHTOKEN: e.target.value })} className={inputClass} placeholder="3JxtDqC..." />
              <p className="text-xs text-gray-400 mt-1">Se guarda encriptado en la base de datos.</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t flex justify-end">
          <button type="submit" disabled={saving || loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50">
            <Save size={20} /> {saving ? 'Guardando...' : 'Guardar Configuraciones'}
          </button>
        </div>
      </form>

      </div>
  );
}