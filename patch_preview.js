const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/admin/plantillas/page.tsx', 'utf8');

const oldRender = `  const renderWizardText = () => {
    const target = \`{{$\{wizardStep + 1}\}}\`;
    const parts = form.bodyText.split(target);
    
    return (
      <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl text-gray-700 whitespace-pre-wrap leading-relaxed shadow-inner font-medium text-lg">
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            {part}
            {i < parts.length - 1 && (
              <span className="bg-yellow-300 text-yellow-900 px-2 py-0.5 rounded shadow-sm transition-all duration-200 inline-block min-w-[30px] text-center">
                {wizardExamples[wizardStep] || target}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };`;

const newRender = `  const renderWizardText = () => {
    // Primero, reemplazamos todas las variables {{x}} por su ejemplo actual,
    // EXCEPTO la que estamos editando en este momento (wizardStep).
    let textToRender = form.bodyText;
    
    // Reemplazar las variables que NO son el paso actual
    for (let i = 0; i < varCount; i++) {
      if (i !== wizardStep && wizardExamples[i]) {
        textToRender = textToRender.replace(new RegExp(\`\\\\{\\\\{\\$\\{i + 1\\}\\}\\\\}\`, 'g'), wizardExamples[i]);
      }
    }

    const target = \`{{$\{wizardStep + 1}\}}\`;
    const parts = textToRender.split(target);
    
    return (
      <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl text-gray-700 whitespace-pre-wrap leading-relaxed shadow-inner font-medium text-lg">
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            {part}
            {i < parts.length - 1 && (
              <span className="bg-yellow-300 text-yellow-900 px-2 py-0.5 rounded shadow-sm transition-all duration-200 inline-block min-w-[30px] text-center">
                {wizardExamples[wizardStep] || target}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };`;

code = code.replace(oldRender, newRender);
fs.writeFileSync('frontend/src/app/admin/plantillas/page.tsx', code);
console.log("Fixed preview bug");
