const fs = require('fs');
const filePath = 'frontend/src/app/admin/plantillas/page.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// The problematic line was: setForm({...form, bodyText: form.bodyText + ` \\{\\{${nextNum}\\}\\}`});
// We need to replace it with: setForm({...form, bodyText: form.bodyText + ` {{${nextNum}}}`});

code = code.replace(
  /bodyText \+ \` \\\{\\\{\\\$\\{nextNum\\}\\\}\\\}\`/g, 
  "bodyText + ` {{${nextNum}}}`"
);

// If the above regex doesn't match perfectly, let's just do a simpler replace
code = code.replace(
  "form.bodyText + ` \\{\\{${nextNum}\\}\\}`",
  "form.bodyText + ` {{${nextNum}}}`"
);

// Let's also make sure we didn't do it in the map function at the bottom:
// JSON.parse(t.variables).map((v: string) => \`\\{\\{\${v}\\}\\}\`).join(', ')
code = code.replace(
  "`\\{\\{${v}\\}\\}`",
  "`{{${v}}}`"
);

fs.writeFileSync(filePath, code);
console.log("Fixed unicode escape error");
