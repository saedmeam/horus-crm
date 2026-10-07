const fs = require('fs');

let f = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

// 1. Remove animate-bounce from the alert container
f = f.replace(/z-\[200\] w-80 overflow-hidden animate-bounce/g, 'z-[200] w-80 overflow-hidden shadow-2xl animate-fade-in-up');
f = f.replace(/<AlarmClock className="w-6 h-6 animate-pulse" \/>/g, '<AlarmClock className="w-6 h-6" />');

// 2. Replace the onClick logic for "Abrir Chat"
const oldOnClick = `onClick={() => {
                  const chat = conversations.find((c: any) => c.contactId === activeAlert.contactId);
                  if (chat) {
                    handleSelectChat(chat);
                  }
                  setActiveAlert(null);
                }}`;

const newOnClick = `onClick={async () => {
                  let chat = conversations.find((c: any) => c.contactId === activeAlert.contactId);
                  
                  try {
                    const token = localStorage.getItem('token');
                    const res = await fetch(\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/conversations?t=\${Date.now()}\`, { headers: { 'Authorization': 'Bearer ' + token } });
                    if (res.ok) {
                       const data = await res.json();
                       const u = JSON.parse(localStorage.getItem('user') || '{}');
                       
                       let found = data.find((c: any) => c.contactId === activeAlert.contactId && c.assignedUserId === u.id);
                       if (!found) {
                           found = data.filter((c: any) => c.contactId === activeAlert.contactId)
                                       .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
                       }
                       if (found) {
                           chat = found;
                           setConversations(data);
                       }
                    }
                  } catch (e) {}

                  if (chat) {
                    handleSelectChat(chat);
                  }
                  setActiveAlert(null);
                }}`;

f = f.replace(oldOnClick, newOnClick);

fs.writeFileSync('frontend/src/app/page.tsx', f);
console.log('page.tsx alert logic patched successfully');
