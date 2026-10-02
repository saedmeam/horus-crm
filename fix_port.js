const fs = require('fs');
let code = fs.readFileSync('docker-compose.yml', 'utf8');
code = code.replace(/"4000:3000"/g, '"4000:3002"');
fs.writeFileSync('docker-compose.yml', code);
