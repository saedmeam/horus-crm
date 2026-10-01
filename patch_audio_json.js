const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

const target3 = `            const uploadRes = await fetch(\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/upload\`, {
              method: 'POST',
              headers: { 'Authorization': \`Bearer \${token}\` },
              body: formData
            });
            const { url } = await uploadRes.json();`;

const repl3 = `            const uploadRes = await fetch(\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/upload\`, {
              method: 'POST',
              headers: { 'Authorization': \`Bearer \${token}\` },
              body: formData
            });
            if (!uploadRes.ok) {
               if (uploadRes.status === 401 || uploadRes.status === 403) {
                  localStorage.removeItem('token');
                  window.location.href = '/login';
               }
               return;
            }
            const { url } = await uploadRes.json();`;

code = code.replace(target3, repl3);
fs.writeFileSync('frontend/src/app/page.tsx', code);
console.log('Fixed audio upload json calls');
