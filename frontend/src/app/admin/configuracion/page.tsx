'use client';

import { useEffect, useState } from 'react';
import { Save, Key, Send, Inbox, FileText, Link, Copy } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
  const webhookUrl = `${API_URL}/webhook/whatsapp`;

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/meta-settings`, {
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
      const res = await fetch(`${API_URL}/api/meta-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        showAlert('Configuraciones guardadas correctamente.', 'success');
      } else {
        showAlert('Error guardando configuraciones.', 'error');
      }
    } catch (e) {
      console.error(e);
      showAlert('Error guardando configuraciones.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const copyWebhook = () => {
    try {
      navigator.clipboard?.writeText(webhookUrl);
    } catch (e) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputClass = 'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm text-gray-800';
  const labelClass = 'block text-sm font-semibold text-gray-700 mb-1';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
          <Key size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Configuración de Meta (WhatsApp Cloud API)</h1>
          <p className="text-gray-500 mt-1">Aquí parametrizas todo lo necesario para ENVIAR y RECIBIR mensajes. Los datos se guardan en la base de datos.</p>
        </div>
      </div>

      {/* URL del Webhook */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 border-b pb-2">
          <Link size={20} className="text-purple-500" /> URL del Webhook (pégala en Meta)
        </h3>
        <p className="text-sm text-gray-500 mt-3">Esta es la URL que debes poner en Meta para RECIBIR mensajes. Ve a developers.facebook.com → tu app → WhatsApp → Configuración → Webhook.</p>
        <div className="flex items-center gap-2 mt-3">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-mono text-sm text-gray-800 break-all">
            {webhookUrl}
          </div>
          <button type="button" onClick={copyWebhook} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold flex items-center gap-1 transition-colors">
            <Copy size={16} /> {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">El campo "Verify token" de Meta debe coincidir con el "Token de Verificación" de la sección Recepción (abajo).</p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 space-y-8">

          {/* ENVÍO */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 border-b pb-2">
              <Send size={20} className="text-blue-600" /> Envío de mensajes
            </h3>

            <div>
              <label className={labelClass}>WhatsApp Token (Token de acceso)</label>
              <input
                type="password"
                value={settings.WHATSAPP_TOKEN}
                onChange={e => setSettings({ ...settings, WHATSAPP_TOKEN: e.target.value })}
                className={inputClass}
                placeholder="EAAT0mj..."
              />
              <p className="text-xs text-gray-400 mt-1">Token de acceso de Meta. Lo obtienes en developers.facebook.com → tu app → WhatsApp → API Setup.</p>
            </div>

            <div>
              <label className={labelClass}>Phone Number ID (ID del número de WhatsApp)</label>
              <input
                type="text"
                value={settings.DEFAULT_PHONE_NUMBER_ID}
                onChange={e => setSettings({ ...settings, DEFAULT_PHONE_NUMBER_ID: e.target.value })}
                className={inputClass}
                placeholder="Ej: 1350864618112079"
              />
              <p className="text-xs text-gray-400 mt-1">El ID del número desde el cual se envían los mensajes. También está en API Setup de Meta.</p>
            </div>
          </div>

          {/* RECEPCIÓN */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 border-b pb-2">
              <Inbox size={20} className="text-green-600" /> Recepción de mensajes (Webhook)
            </h3>

            <div>
              <label className={labelClass}>Token de Verificación (Verify Token)</label>
              <input
                type="text"
                value={settings.WHATSAPP_VERIFY_TOKEN}
                onChange={e => setSettings({ ...settings, WHATSAPP_VERIFY_TOKEN: e.target.value })}
                className={inputClass}
                placeholder="mi_token_secreto_horustech"
              />
              <p className="text-xs text-gray-400 mt-1">Debe coincidir con el "Verify token" que pones en Meta al configurar el webhook.</p>
            </div>
          </div>

          {/* PLANTILLAS */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 border-b pb-2">
              <FileText size={20} className="text-amber-600" /> Plantillas de Meta (opcional)
            </h3>

            <div>
              <label className={labelClass}>WABA ID (ID de la cuenta de WhatsApp Business)</label>
              <input
                type="text"
                value={settings.WABA_ID}
                onChange={e => setSettings({ ...settings, WABA_ID: e.target.value })}
                className={inputClass}
                placeholder="Ej: 1406360574269503"
              />
              <p className="text-xs text-gray-400 mt-1">Necesario para sincronizar el estado de tus plantillas oficiales.</p>
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