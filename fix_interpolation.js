const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    if (fs.statSync(file).isDirectory()) results = results.concat(walk(file));
    else if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
  });
  return results;
}
walk('frontend/src').forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('\\${process.env.NEXT_PUBLIC_API_URL')) {
    content = content.replace(/\\\$\{process\.env\.NEXT_PUBLIC_API_URL/g, '${process.env.NEXT_PUBLIC_API_URL');
    fs.writeFileSync(file, content);
    console.log('Fixed interpolation in', file);
  }
});
