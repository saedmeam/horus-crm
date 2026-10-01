const fs = require('fs');

let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

// 1. Añadir el estado de plantillas (si no existe)
if (!code.includes('const [metaTemplates, setMetaTemplates] = useState')) {
  code = code.replace(
    /const \[snippets, setSnippets\] = useState<any\[\]>\(\[\]\);/,
    "const [snippets, setSnippets] = useState<any[]>([]);\n  const [metaTemplates, setMetaTemplates] = useState<any[]>([]);\n  const [templateWizard, setTemplateWizard] = useState<any>(null);"
  );
}

// 2. Modificar fetchConversations para incluir templates
const fetchConvOriginal = `  const fetchConversations = () => {
    fetch(\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/settings\`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
      .then(res => res.json())
      .then(data => setSnippets(data.snippets || []));

    fetch(\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/conversations\`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
      .then(res => res.json())
      .then(data => setConversations(Array.isArray(data) ? data : []));
  };`;

const fetchConvNew = `  const fetchConversations = () => {
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

code = code.replace(fetchConvOriginal, fetchConvNew);

// 3. Renderizado del popup de Snippets (y WIZARD logic)
const snippetRenderOriginal = `{showSnippets && chatMode === 'MESSAGE' && (
    <div className="absolute bottom-20 left-4 bg-white dark:bg-[#202c33] border border-gray-200 dark:border-[#2a3942] rounded-xl shadow-lg w-80 max-h-64 overflow-y-auto z-20">
      <div className="p-2 bg-gray-50 dark:bg-[#111b21] border-b border-gray-100 dark:border-[#2a3942] text-xs font-bold text-gray-500">
        Respuestas Rápidas (Snippets)
      </div>
      {snippets.filter(s => s.shortcut.includes(snippetFilter)).map(snippet => (
        <div 
          key={snippet.id} 
          onClick={() => {
            setInputText(snippet.text || '');
            if (snippet.mediaUrl) setPendingMedia(snippet.mediaUrl);
            setShowSnippets(false);
          }}
          className="p-3 hover:bg-gray-50 dark:hover:bg-[#2a3942] cursor-pointer border-b border-gray-50 dark:border-[#2a3942] last:border-0 flex flex-col gap-1"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-600 dark:text-[#00a884] text-sm font-mono">/{snippet.shortcut}</span>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-300 truncate">{snippet.text}</span>
        </div>
      ))}
      {snippets.filter(s => s.shortcut.includes(snippetFilter)).length === 0 && (
        <div className="p-4 text-center text-xs text-gray-400">No se encontraron snippets</div>
      )}
    </div>
  )}`;

const snippetRenderNew = `
  const handleSelectMetaTemplate = (t: any) => {
    const varNames = JSON.parse(t.variables || '[]');
    if (varNames.length > 0) {
      setTemplateWizard({ template: t, step: 0, examples: Array(varNames.length).fill(''), varCount: varNames.length });
    } else {
      executeSendTemplate(t, []);
    }
    setShowSnippets(false);
  };

  const executeSendTemplate = async (template: any, examples: string[]) => {
    try {
      const res = await fetch(\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/conversations/\${selectedChat.id}/template\`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token'),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateName: template.name,
          languageCode: template.language,
          variables: examples
        })
      });
      if (!res.ok) {
         const d = await res.json();
         alert('Error al enviar plantilla: ' + (d.error || 'Error de Meta'));
      } else {
         setInputText('');
      }
    } catch(e) {
       alert('Error de conexion');
    }
  };

  {templateWizard && (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#202c33] rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
         <div className="p-4 border-b border-gray-100 dark:border-[#2a3942]">
           <h3 className="font-bold text-gray-800 dark:text-white">Enviar Plantilla Meta: {templateWizard.template.name}</h3>
           <p className="text-sm text-gray-500">Paso {templateWizard.step + 1} de {templateWizard.varCount}</p>
         </div>
         <div className="p-6">
            <p className="text-sm font-bold text-yellow-600 mb-2">Llena la variable {{\`{{\${templateWizard.step + 1}}}\`}}</p>
            <input 
               autoFocus
               type="text" 
               className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-[#111b21] dark:text-white"
               placeholder="Valor para el cliente"
               value={templateWizard.examples[templateWizard.step]}
               onChange={e => {
                 const newEx = [...templateWizard.examples];
                 newEx[templateWizard.step] = e.target.value;
                 setTemplateWizard({...templateWizard, examples: newEx});
               }}
               onKeyDown={e => {
                 if (e.key === 'Enter') {
                    if (templateWizard.step < templateWizard.varCount - 1) {
                       setTemplateWizard({...templateWizard, step: templateWizard.step + 1});
                    } else {
                       executeSendTemplate(templateWizard.template, templateWizard.examples);
                       setTemplateWizard(null);
                    }
                 }
               }}
            />
         </div>
         <div className="p-4 border-t border-gray-100 dark:border-[#2a3942] flex justify-end gap-2">
            <button onClick={() => setTemplateWizard(null)} className="px-4 py-2 text-gray-500">Cancelar</button>
            <button 
               onClick={() => {
                 if (templateWizard.step < templateWizard.varCount - 1) {
                    setTemplateWizard({...templateWizard, step: templateWizard.step + 1});
                 } else {
                    executeSendTemplate(templateWizard.template, templateWizard.examples);
                    setTemplateWizard(null);
                 }
               }} 
               className="px-4 py-2 bg-[#00a884] text-white rounded-lg font-medium"
            >
               {templateWizard.step < templateWizard.varCount - 1 ? 'Siguiente' : 'Enviar Plantilla'}
            </button>
         </div>
      </div>
    </div>
  )}

  {showSnippets && chatMode === 'MESSAGE' && (
    <div className="absolute bottom-20 left-4 bg-white dark:bg-[#202c33] border border-gray-200 dark:border-[#2a3942] rounded-xl shadow-lg w-80 max-h-80 overflow-y-auto z-20">
      
      {/* SECCION PLANTILLAS META */}
      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 text-xs font-bold text-blue-700 dark:text-blue-300 flex justify-between">
        <span>Plantillas Oficiales de Meta</span>
      </div>
      {metaTemplates.filter(t => t.name.includes(snippetFilter)).map(t => (
        <div 
          key={'meta-'+t.id} 
          onClick={() => handleSelectMetaTemplate(t)}
          className="p-3 hover:bg-gray-50 dark:hover:bg-[#2a3942] cursor-pointer border-b border-gray-50 dark:border-[#2a3942] flex flex-col gap-1"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-600 dark:text-blue-400 text-sm font-mono">/{t.name}</span>
            <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 rounded">{t.category}</span>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-300 truncate">{t.bodyText}</span>
        </div>
      ))}

      {/* SECCION SNIPPETS */}
      <div className="p-2 bg-gray-50 dark:bg-[#111b21] border-y border-gray-100 dark:border-[#2a3942] text-xs font-bold text-gray-500">
        Respuestas Rápidas (Snippets)
      </div>
      {snippets.filter(s => s.shortcut.includes(snippetFilter)).map(snippet => (
        <div 
          key={snippet.id} 
          onClick={() => {
            setInputText(snippet.text || '');
            if (snippet.mediaUrl) setPendingMedia(snippet.mediaUrl);
            setShowSnippets(false);
          }}
          className="p-3 hover:bg-gray-50 dark:hover:bg-[#2a3942] cursor-pointer border-b border-gray-50 dark:border-[#2a3942] last:border-0 flex flex-col gap-1"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#00a884] text-sm font-mono">/{snippet.shortcut}</span>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-300 truncate">{snippet.text}</span>
        </div>
      ))}

      {snippets.filter(s => s.shortcut.includes(snippetFilter)).length === 0 && metaTemplates.filter(t => t.name.includes(snippetFilter)).length === 0 && (
        <div className="p-4 text-center text-xs text-gray-400">No se encontraron atajos</div>
      )}
    </div>
  )}`;

code = code.replace(snippetRenderOriginal, snippetRenderNew);

fs.writeFileSync('frontend/src/app/page.tsx', code);
console.log("Chat patched for Meta Templates!");
