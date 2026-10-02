const fs = require('fs');

let backendPath = 'backend/src/index.ts';
let content = fs.readFileSync(backendPath, 'utf8');

content = content.replace(/typeof contact !== 'undefined' \? \(contact as any\)\.name : undefined/g, "undefined");
content = content.replace(/typeof contact !== 'undefined' \? \(contact as any\)\.phone : undefined/g, "undefined");

fs.writeFileSync(backendPath, content);
console.log('Backend TS fixed locally.');
