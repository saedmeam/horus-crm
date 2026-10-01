const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/recordatorios/page.tsx', 'utf8');

// Replace the useEffect block containing the interval
const regex = /useEffect\(\(\) => \{\s*const interval = setInterval[\s\S]*?\}, \[reminders\]\);/g;
code = code.replace(regex, '');

fs.writeFileSync('frontend/src/app/recordatorios/page.tsx', code);
console.log("Removed duplicate interval");
