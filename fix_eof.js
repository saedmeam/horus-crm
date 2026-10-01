const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

if (!code.endsWith('}')) {
  code += '\n  );\n}';
  fs.writeFileSync('frontend/src/app/page.tsx', code);
  console.log("Fixed EOF error in page.tsx");
} else {
  console.log("Already fixed?");
}
