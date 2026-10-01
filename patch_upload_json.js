const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

const target2 = `        if (res.ok) {
          const data = await res.json();
          setPendingMedia(data.url);
        } else {
          const err = await res.json();
          alert('Error: ' + err.error);
        }`;

const repl2 = `        if (res.ok) {
          const data = await res.json();
          setPendingMedia(data.url);
        } else {
          if (res.status === 401 || res.status === 403) {
             localStorage.removeItem('token');
             window.location.href = '/login';
             return;
          }
          let err = {};
          try { err = await res.json(); } catch(e) {}
          alert('Error: ' + (err.error || 'Upload error'));
        }`;

code = code.replace(target2, repl2);
fs.writeFileSync('frontend/src/app/page.tsx', code);
console.log('Fixed upload json calls');
