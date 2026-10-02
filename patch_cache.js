const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

// replace 1: fetchConversations
code = code.replace(
  /\/api\/conversations`, \{ headers:/g,
  '/api/conversations?t=\' + Date.now(), { cache: \'no-store\', headers:'
);

// replace 2: fetch messages in handleSelectChat
code = code.replace(
  /\/api\/conversations\/` \+ chat\.id \+ '\/messages', \{ headers:/g,
  '/api/conversations/\` + chat.id + \'/messages?t=\' + Date.now(), { cache: \'no-store\', headers:'
);

fs.writeFileSync('frontend/src/app/page.tsx', code);
console.log('Done');
