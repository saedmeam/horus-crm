const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

const target1 = "const metaPhoneId = creds.defaultPhoneId || process.env.META_PHONE_ID;";
const repl1 = "const metaPhoneId = creds.phoneNumberId || process.env.META_PHONE_ID;";
code = code.replace(target1, repl1);

const target2 = "let phoneNumberId = creds.defaultPhoneId || process.env.DEFAULT_PHONE_NUMBER_ID || '';";
const repl2 = "let phoneNumberId = creds.phoneNumberId || process.env.DEFAULT_PHONE_NUMBER_ID || '';";
code = code.replace(target2, repl2);

fs.writeFileSync('backend/src/index.ts', code);
console.log('Fixed credential keys');
