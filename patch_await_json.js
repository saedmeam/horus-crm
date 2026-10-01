const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

const target1 = `      if (!res.ok) {
         const d = await res.json();
         alert('Error al enviar plantilla: ' + (d.error || 'Error de Meta'));
      }`;
      
const repl1 = `      if (!res.ok) {
         if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return;
         }
         let d = {};
         try { d = await res.json(); } catch(e) {}
         alert('Error al enviar plantilla: ' + (d.error || 'Error de Meta'));
      }`;

code = code.replace(target1, repl1);

fs.writeFileSync('frontend/src/app/page.tsx', code);
console.log('Fixed await json calls');
