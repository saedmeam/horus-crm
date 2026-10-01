const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

const replacement = `.then(res => {
        if(res.status === 401 || res.status === 403) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            throw new Error('Auth error');
        }
        return res.json();
      })`;

code = code.replace(/\.then\(res\s*=>\s*res\.json\(\)\)/g, replacement);
code = code.replace(/\.then\(r\s*=>\s*r\.json\(\)\)/g, replacement);

fs.writeFileSync('frontend/src/app/page.tsx', code);
console.log("Replaced all fetch JSON handlers!");
