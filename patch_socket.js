const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

const anchor = `newSocket.on('new_message', (newMsg: any) => {`;
const injection = `newSocket.on('message_status_update', (data: any) => {
        setMessages(prev => prev.map(msg => 
          msg.metaMessageId === data.metaMessageId 
            ? { ...msg, status: data.status } 
            : msg
        ));
      });
      
      newSocket.on('new_message', (newMsg: any) => {`;

if (!code.includes('message_status_update')) {
  code = code.replace(anchor, injection);
  fs.writeFileSync('frontend/src/app/page.tsx', code);
  console.log('Successfully injected message_status_update socket listener!');
} else {
  console.log('Listener already exists.');
}
