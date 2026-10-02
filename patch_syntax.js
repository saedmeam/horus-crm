const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

// The original replacement made it: `/api/conversations?t=' + Date.now(), { cache: 'no-store', headers:`
// Notice it lost the closing backtick of the template literal.
// Let's replace the broken string:
code = code.replace(/\/api\/conversations\?t=' \+ Date\.now\(\), \{ cache: 'no-store', headers:/g, '/api/conversations?t=${Date.now()}`, { cache: \\'no-store\\', headers:');

// And for the messages fetch, it was:
// `/api/conversations/` + chat.id + `/messages?t=' + Date.now(), { cache: 'no-store', headers:`
code = code.replace(/\/api\/conversations\/` \+ chat\.id \+ '\/messages\?t=' \+ Date\.now\(\), \{ cache: 'no-store', headers:/g, '/api/conversations/` + chat.id + `/messages?t=${Date.now()}`, { cache: \\'no-store\\', headers:');

fs.writeFileSync('frontend/src/app/page.tsx', code);
console.log('Fixed syntax error in page.tsx');
