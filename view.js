const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');
const start = content.indexOf("newSocket.on('new_message'");
console.log(content.substring(start, start + 2000));
