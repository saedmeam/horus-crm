const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const regex = /await fetch\(\`\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:3001'\}\/api\/conversations\/\` \+ selectedChat\.id \+ '\/messages', \{\s*headers: \{ 'Content-Type': 'application\/json', 'Authorization': 'Bearer ' \+ localStorage\.getItem\('token'\) \},\s*method: 'POST',\s*body: JSON\.stringify\(\{([\s\S]*?)\}\)\s*\}\);/g;

const replacement = `const res = await fetch(\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/conversations/\` + selectedChat.id + '/messages', {
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        method: 'POST',
        body: JSON.stringify({$1})
      });
      if (!res.ok) {
        const errorData = await res.json();
        alert('Error enviando mensaje: ' + (errorData.error || 'Error desconocido'));
      }`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/app/page.tsx', code);
console.log('Added frontend error alert');
