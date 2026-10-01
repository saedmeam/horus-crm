const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

const oldCodeMsg = `          const metaData = await metaRes.json();
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
        } catch (err) {
          console.error('Error al enviar a Meta:', err);
        }
      }
  
      res.json(savedMessage);`;

const newCodeMsg = `          const metaData = await metaRes.json();
          console.log('Respuesta de Meta:', metaData);
          if (metaData.error) {
             return res.status(400).json({ error: 'Meta Error: ' + metaData.error.message });
          }
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
        } catch (err) {
          console.error('Error al enviar a Meta:', err);
          return res.status(500).json({ error: 'Fallo al conectar con Meta' });
        }
      }
  
      res.json(savedMessage);`;

code = code.replace(oldCodeMsg, newCodeMsg);
fs.writeFileSync('backend/src/index.ts', code);
console.log('Fixed error handling in messages route!');
