const fs = require('fs');

let f = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

const oldEffect = `// Abrir la conversacin indicada por ?chat=... al cargar (para notificaciones nativas)
    useEffect(() => {
      if (conversations.length === 0) return;
      const params = new URLSearchParams(window.location.search);
      const chatId = params.get('chat');
      if (!chatId) return;
      const target = conversations.find((c: any) => c.id === chatId);
      if (target) {
        handleSelectChat(target);
        const url = new URL(window.location.href);
        url.searchParams.delete('chat');
        window.history.replaceState({}, '', url.toString());
      }
    }, [conversations]);`;

const oldEffect2 = `// Abrir la conversación indicada por ?chat=... al cargar (para notificaciones nativas)
    useEffect(() => {
      if (conversations.length === 0) return;
      const params = new URLSearchParams(window.location.search);
      const chatId = params.get('chat');
      if (!chatId) return;
      const target = conversations.find((c: any) => c.id === chatId);
      if (target) {
        handleSelectChat(target);
        const url = new URL(window.location.href);
        url.searchParams.delete('chat');
        window.history.replaceState({}, '', url.toString());
      }
    }, [conversations]);`;

const newEffect = `// Abrir la conversacion indicada por URL al cargar
    useEffect(() => {
      if (conversations.length === 0) return;
      const params = new URLSearchParams(window.location.search);
      const chatId = params.get('chat');
      const contactId = params.get('chatId') || params.get('contactId'); // GlobalAlerts uses chatId= contactId

      let target = null;
      if (chatId) {
        target = conversations.find((c: any) => c.id === chatId);
      } else if (contactId) {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        target = conversations.find((c: any) => c.contactId === contactId && c.assignedUserId === u.id);
        if (!target) {
          target = [...conversations]
            .filter((c: any) => c.contactId === contactId)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
        }
      }

      if (target) {
        handleSelectChat(target);
        const url = new URL(window.location.href);
        url.searchParams.delete('chat');
        url.searchParams.delete('chatId');
        url.searchParams.delete('contactId');
        window.history.replaceState({}, '', url.toString());
      }
    }, [conversations]);`;

let replaced = false;
if (f.includes(oldEffect)) {
    f = f.replace(oldEffect, newEffect);
    replaced = true;
} else if (f.includes(oldEffect2)) {
    f = f.replace(oldEffect2, newEffect);
    replaced = true;
} else {
    // try regex
    const regex = /\/\/\s*Abrir la conversaci[ó]n indicada por \?chat=\.\.\. al cargar.*?\n\s*useEffect\(\(\) => \{\s*if \(conversations\.length === 0\) return;\s*const params = new URLSearchParams\(window\.location\.search\);\s*const chatId = params\.get\('chat'\);\s*if \(!chatId\) return;\s*const target = conversations\.find\(\(c: any\) => c\.id === chatId\);\s*if \(target\) \{\s*handleSelectChat\(target\);\s*const url = new URL\(window\.location\.href\);\s*url\.searchParams\.delete\('chat'\);\s*window\.history\.replaceState\(\{\}, '', url\.toString\(\)\);\s*\}\s*\}, \[conversations\]\);/gs;
    f = f.replace(regex, newEffect);
    replaced = true;
}

fs.writeFileSync('frontend/src/app/page.tsx', f);
console.log('page.tsx search param logic patched: ' + replaced);
