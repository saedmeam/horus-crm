const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

const btnInjection = `
  <button 
    type="button"
    onClick={() => setShowTemplateModal(true)}
    title="Enviar Plantilla (Romper 24h)" 
    className="p-3 text-white rounded-full shadow-md transition-colors bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 mr-2"
  >
    <FileText size={20} />
  </button>
  <form`;

code = code.replace('<form onSubmit={handleSendMessage}', btnInjection + ' onSubmit={handleSendMessage}');

fs.writeFileSync('frontend/src/app/page.tsx', code);
console.log("Injected template button successfully.");
