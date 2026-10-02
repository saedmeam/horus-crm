const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('frontend/src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Replace 'http://localhost:3001...' with `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}...`
  content = content.replace(/'http:\/\/localhost:3001([^']*)'/g, "`\\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}$1`");

  // Replace "http://localhost:3001..." with `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}...`
  content = content.replace(/\"http:\/\/localhost:3001([^\"]*)\"/g, "`\\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}$1`");

  // Replace io('http://localhost:3001') -> io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001')
  content = content.replace(/io\('http:\/\/localhost:3001'\)/g, "io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001')");

  // Replace `http://localhost:3001/api...`
  content = content.replace(/http:\/\/localhost:3001/g, "${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}");
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
});
