const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

// We need to replace body_text: [varNames.map(() => 'texto_ejemplo')]
// with body_text: [varNames.map((_, i) => i === 0 ? 'Juan' : 'Producto XYZ')]

code = code.replace(
  /body_text: \[varNames\.map\(\(\) => 'texto_ejemplo'\)\]/g,
  "body_text: [varNames.map((_, i) => i === 0 ? 'Juan' : 'Impresora 3D')]"
);

fs.writeFileSync('backend/src/index.ts', code);
console.log("Patched example variable logic in Meta template submissions to use real words");
