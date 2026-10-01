const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

const oldFetch = `  const fetchConversations = () => {
    fetch(\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/settings\`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
      .then(res => res.json())
      .then(data => setSnippets(data.snippets || []));

    fetch(\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/templates\`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
      .then(res => res.json())
      .then(data => {
         if(Array.isArray(data)) setMetaTemplates(data.filter((t: any) => t.status === 'APPROVED' || t.status === 'LOCAL'));
      }).catch(e => console.error("Error fetching templates", e));

    fetch(\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/conversations\`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
      .then(res => res.json())
      .then(data => setConversations(Array.isArray(data) ? data : []));
  };`;

const newFetch = `  const fetchConversations = () => {
    const handleResponse = async (res: Response) => {
       if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          router.push('/login');
          throw new Error('Unauthorized');
       }
       if (!res.ok) throw new Error('API Error');
       return res.json();
    };

    fetch(\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/settings\`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
      .then(handleResponse)
      .then(data => setSnippets(data.snippets || [])).catch(e => console.error(e));

    fetch(\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/templates\`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
      .then(handleResponse)
      .then(data => {
         if(Array.isArray(data)) setMetaTemplates(data.filter((t: any) => t.status === 'APPROVED' || t.status === 'LOCAL'));
      }).catch(e => console.error(e));

    fetch(\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/conversations\`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
      .then(handleResponse)
      .then(data => setConversations(Array.isArray(data) ? data : [])).catch(e => console.error(e));
  };`;

code = code.replace(oldFetch, newFetch);
fs.writeFileSync('frontend/src/app/page.tsx', code);
console.log('Fixed fetch handler!');
