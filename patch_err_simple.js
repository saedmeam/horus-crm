const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

const target = "const err = await res.json();";
const repl = "let err = { error: 'Upload failed' }; try { err = await res.json(); } catch(e) {}";

code = code.replace(target, repl);

const target2 = "const data = await res.json();";
const repl2 = "let data = { url: '' }; try { data = await res.json(); } catch(e) {}";

code = code.replace(target2, repl2);

fs.writeFileSync('frontend/src/app/page.tsx', code);
console.log('Fixed exactly!');
