const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

const target = `          const metaData = await metaRes.json();
          console.log('Respuesta de Meta:', metaData);
        } catch (err) {`;

const repl = `          const metaData = await metaRes.json();
          console.log('Respuesta de Meta:', metaData);
          if (metaData.messages && metaData.messages[0]) {
             await prisma.message.update({
               where: { id: savedMessage.id },
               data: { metaMessageId: metaData.messages[0].id, status: 'SENT' }
             });
             io.emit('message_status_update', { 
               metaMessageId: metaData.messages[0].id, 
               status: 'SENT', 
               conversationId: savedMessage.conversationId 
             });
          }
        } catch (err) {`;

code = code.replace(target, repl);
fs.writeFileSync('backend/src/index.ts', code);
console.log('Fixed metaMessageId saving in backend!');
