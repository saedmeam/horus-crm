const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

code = code.split("/api/conversations?t=' + Date.now(), { cache: 'no-store', headers:").join("/api/conversations?t=${Date.now()}`, { cache: 'no-store', headers:");

code = code.split("/api/conversations/` + chat.id + '/messages?t=' + Date.now(), { cache: 'no-store', headers:").join("/api/conversations/` + chat.id + `/messages?t=${Date.now()}`, { cache: 'no-store', headers:");

fs.writeFileSync('frontend/src/app/page.tsx', code);
console.log('Fixed syntax error in page.tsx');
