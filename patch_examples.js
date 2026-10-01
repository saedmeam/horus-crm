const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

// We need to patch the components building logic in POST and PUT /api/templates

// Patching POST
const oldPostLogic = `
        const payload = {
          name,
          category,
          components: [{ type: 'BODY', text: metaBodyText }],
          language
        };`;

const newPostLogic = `
        const componentPayload: any = { type: 'BODY', text: metaBodyText };
        if (varNames.length > 0) {
          componentPayload.example = {
            body_text: [varNames.map(() => 'texto_ejemplo')]
          };
        }
        
        const payload = {
          name,
          category,
          components: [componentPayload],
          language
        };`;

code = code.replace(oldPostLogic, newPostLogic);

// Patching PUT
const oldPutLogic = `
      // Editar en Meta (Se envía igual que crear, Meta lo toma como una edición si el nombre ya existe)
      const payload = { name, category, components: [{ type: 'BODY', text: bodyText }], language };`;

const newPutLogic = `
      // Editar en Meta
      const varNames = JSON.parse(variables || '[]');
      const componentPayload: any = { type: 'BODY', text: bodyText };
      if (varNames.length > 0) {
        componentPayload.example = {
          body_text: [varNames.map(() => 'texto_ejemplo')]
        };
      }
      const payload = { name, category, components: [componentPayload], language };`;

code = code.replace(oldPutLogic, newPutLogic);

fs.writeFileSync('backend/src/index.ts', code);
console.log("Patched example variable logic in Meta template submissions");
