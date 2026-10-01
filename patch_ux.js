const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

// 1. Add Toaster import
if (!code.includes('react-hot-toast')) {
  code = code.replace("import { Send, Paperclip", "import { Toaster, toast } from 'react-hot-toast';\nimport { Send, Paperclip");
}

// 2. Add Toaster component to layout
if (!code.includes('<Toaster')) {
  code = code.replace('<MainSidebar />', '<Toaster position="top-right" />\n      <MainSidebar />');
}

// 3. Replace alerts with toasts
code = code.replace(/alert\('Recordatorio guardado'\)/g, "toast.success('Recordatorio guardado')");
code = code.replace(/alert\('Error guardando recordatorio'\)/g, "toast.error('Error guardando recordatorio')");
code = code.replace(/alert\('Pedido guardado correctamente'\)/g, "toast.success('Pedido guardado correctamente')");
code = code.replace(/alert\('Error guardando pedido'\)/g, "toast.error('Error guardando pedido')");
code = code.replace(/alert\('Error al enviar plantilla\. Verifica que el nombre sea correcto en Facebook\.'\)/g, "toast.error('Error al enviar plantilla. Verifica que el nombre sea correcto en Facebook.')");
code = code.replace(/alert\("Por favor permite el acceso al micrófono en tu navegador\."\)/g, "toast.error('Por favor permite el acceso al micrófono en tu navegador.')");
code = code.replace(/alert\('Error al enviar plantilla: ' \+ \(d\.error \|\| 'Error de Meta'\)\)/g, "toast.error('Error al enviar plantilla: ' + (d.error || 'Error de Meta'))");
code = code.replace(/alert\('Error de conexion'\)/g, "toast.error('Error de conexión')");
code = code.replace(/alert\('Error enviando mensaje: ' \+ \(errorData\.error \|\| 'Error desconocido'\)\)/g, "toast.error('Error enviando mensaje: ' + (errorData.error || 'Error desconocido'))");
code = code.replace(/alert\('Informacion de contacto guardada exitosamente'\)/g, "toast.success('Información de contacto guardada exitosamente')");
code = code.replace(/alert\('Error al guardar contacto'\)/g, "toast.error('Error al guardar contacto')");
code = code.replace(/alert\('Error: ' \+ err\.error\)/g, "toast.error('Error: ' + err.error)");
code = code.replace(/alert\('Fallo de red al subir el archivo'\)/g, "toast.error('Fallo de red al subir el archivo')");
code = code.replace(/alert\("Por favor permite el acceso al micrfono en tu navegador."\)/g, "toast.error('Por favor permite el acceso al micrófono en tu navegador.')");


// 4. Add sound to socket listener
const socketAnchor = `      newSocket.on('new_message', (newMsg: any) => {`;
const socketInjection = `      newSocket.on('new_message', (newMsg: any) => {
        if (newMsg.senderType === 'CLIENT') {
          try {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(e => console.log('Audio auto-play blocked', e));
          } catch(e) {}
        }`;

if (code.includes(socketAnchor) && !code.includes('/notification.mp3')) {
  code = code.replace(socketAnchor, socketInjection);
}

fs.writeFileSync('frontend/src/app/page.tsx', code);
console.log('Successfully injected Toasts and Notification Sound!');
