const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

const regex = /newSocket\.on\('message_status_update',\s*\(data:\s*any\)\s*=>\s*\{\s*setMessages\(prev\s*=>\s*prev\.map\(msg\s*=>\s*msg\.metaMessageId\s*===\s*data\.metaMessageId\s*\?\s*\{\s*\.\.\.msg,\s*status:\s*data\.status\s*\}\s*:\s*msg\s*\)\);\s*\}\);/g;

const repl = `newSocket.on('message_status_update', (data: any) => {
        setMessages(prev => prev.map(msg => 
          (data.id && msg.id === data.id) || (data.metaMessageId && msg.metaMessageId === data.metaMessageId)
            ? { ...msg, status: data.status, metaMessageId: data.metaMessageId || msg.metaMessageId } 
            : msg
        ));
      });`;

code = code.replace(regex, repl);
fs.writeFileSync('frontend/src/app/page.tsx', code);
console.log('Fixed frontend message_status_update listener');
