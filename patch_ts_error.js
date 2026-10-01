const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

code = code.replace(
  /varNames\.map\(\(_, i\) =>/g,
  "varNames.map((_: any, i: number) =>"
);

fs.writeFileSync('backend/src/index.ts', code);
console.log("Fixed typescript implicit any error");
