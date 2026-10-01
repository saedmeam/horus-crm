const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

const target = `        } else {
          const err = await res.json();
          alert('Error: ' + err.error);
        }`;

const repl = `        } else {
          if (res.status === 401 || res.status === 403) {
             localStorage.removeItem('token');
             window.location.href = '/login';
             return;
          }
          let err = {};
          try { err = await res.json(); } catch(e) {}
          alert('Error: ' + (err.error || 'Upload error'));
        }`;

code = code.replace(target, repl);
fs.writeFileSync('frontend/src/app/page.tsx', code);
console.log('Fixed upload error parsing');
