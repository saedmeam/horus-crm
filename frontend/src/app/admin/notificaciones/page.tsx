"use client";
import { useEffect, useState } from 'react';
import { Save, Volume2, BellRing, UploadCloud } from 'lucide-react';

export default function NotificacionesAdminPage() {
  const [msgSoundUrl, setMsgSoundUrl] = useState('');
  const [alarmSoundUrl, setAlarmSoundUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    let msg = localStorage.getItem('msgSound');
    let alarm = localStorage.getItem('alarmSound');
    
    if (!msg || msg.includes('pop_hollow.ogg')) {
      msg = '/sounds/message.mp3';
      localStorage.setItem('msgSound', msg);
    }
    if (!alarm || alarm.includes('bugle_tune.ogg')) {
      alarm = '/sounds/reminder.mp3';
      localStorage.setItem('alarmSound', alarm);
    }
    
    setMsgSoundUrl(msg);
    setAlarmSoundUrl(alarm);
  }, []);

  const handleSave = () => {
    localStorage.setItem('msgSound', msgSoundUrl);
    localStorage.setItem('alarmSound', alarmSoundUrl);
    alert('Configuración guardada en este navegador.');
  };

  const playSound = (url: string) => {
    if (!url) return;
    const audio = new Audio(url);
    audio.play().catch(e => alert('Error al reproducir: ' + e.message));
  };

  const handleUpload = async (e: any, setUrlFn: any) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate format
    const validFormats = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg'];
    if (!validFormats.includes(file.type)) {
      alert('Formato no permitido. Por favor sube un archivo .mp3, .wav o .ogg');
      e.target.value = '';
      return;
    }

    // Validate size (e.g., max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('El archivo es muy grande. Máximo 2MB.');
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        setUrlFn(data.url);
      } else {
        alert('Error al subir el archivo');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al subir el archivo');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // reset input
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
        <div className="bg-blue-100 p-2 rounded-lg">
          <BellRing className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">Notificaciones y Sonidos</h2>
          <p className="text-sm text-gray-500">Personaliza las alertas de mensajes y recordatorios</p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        
        {/* Mensajes */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Sonido de Nuevos Mensajes
          </label>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={msgSoundUrl}
                readOnly
                className="w-full border border-gray-300 bg-gray-50 rounded-lg px-4 py-2 text-sm text-gray-500 outline-none"
              />
              <div className="absolute inset-y-0 right-2 flex items-center">
                <label className="cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors">
                  <UploadCloud className="w-4 h-4" />
                  {isUploading ? 'Subiendo...' : 'Cargar audio'}
                  <input 
                    type="file" 
                    accept="audio/mp3, audio/wav, audio/mpeg, audio/ogg" 
                    className="hidden" 
                    onChange={(e) => handleUpload(e, setMsgSoundUrl)}
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>
            <button 
              onClick={() => playSound(msgSoundUrl)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <Volume2 className="w-4 h-4" /> Probar
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Se reproducirá cuando un cliente envíe un mensaje a un chat que tengas asignado. Formatados permitidos: .mp3, .wav (Máx 2MB)
          </p>
        </div>

        {/* Alarmas */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Sonido de Alarmas (Recordatorios)
          </label>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={alarmSoundUrl}
                readOnly
                className="w-full border border-gray-300 bg-gray-50 rounded-lg px-4 py-2 text-sm text-gray-500 outline-none"
              />
              <div className="absolute inset-y-0 right-2 flex items-center">
                <label className="cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors">
                  <UploadCloud className="w-4 h-4" />
                  {isUploading ? 'Subiendo...' : 'Cargar audio'}
                  <input 
                    type="file" 
                    accept="audio/mp3, audio/wav, audio/mpeg, audio/ogg" 
                    className="hidden" 
                    onChange={(e) => handleUpload(e, setAlarmSoundUrl)}
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>
            <button 
              onClick={() => playSound(alarmSoundUrl)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <Volume2 className="w-4 h-4" /> Probar
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Se reproducirá automáticamente al cumplirse el tiempo de un recordatorio pendiente.
          </p>
        </div>

      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
        <button 
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-bold flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Guardar Cambios
        </button>
      </div>
    </div>
  );
}
