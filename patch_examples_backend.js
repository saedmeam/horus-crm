const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

// Patch PUT
const putFind = "const { name, category, language, bodyText, variables, submitToMeta } = req.body;";
const putReplace = "const { name, category, language, bodyText, variables, examples, submitToMeta } = req.body;";
code = code.replace(putFind, putReplace);

const putLogicFind = `
      const varNames = JSON.parse(variables || '[]');
      const componentPayload: any = { type: 'BODY', text: bodyText };
      if (varNames.length > 0) {
        componentPayload.example = {
          body_text: [varNames.map((_, i) => i === 0 ? 'Juan' : 'Impresora 3D')]
        };
      }`;
const putLogicReplace = `
      const varNames = JSON.parse(variables || '[]');
      const exampleValues = examples ? JSON.parse(examples) : [];
      const componentPayload: any = { type: 'BODY', text: bodyText };
      if (varNames.length > 0) {
        componentPayload.example = {
          body_text: [exampleValues.length === varNames.length ? exampleValues : varNames.map((_, i) => i === 0 ? 'Juan' : 'Impresora 3D')]
        };
      }`;
code = code.replace(putLogicFind, putLogicReplace);

// Patch POST
const postFind = "const { name, category, language, bodyText, variables, submitToMeta } = req.body;";
const postReplace = "const { name, category, language, bodyText, variables, examples, submitToMeta } = req.body;";
code = code.replace(postFind, postReplace);

const postLogicFind = `
        const componentPayload: any = { type: 'BODY', text: metaBodyText };
        if (varNames.length > 0) {
          componentPayload.example = {
            body_text: [varNames.map((_, i) => i === 0 ? 'Juan' : 'Impresora 3D')]
          };
        }`;
const postLogicReplace = `
        const exampleValues = examples ? JSON.parse(examples) : [];
        const componentPayload: any = { type: 'BODY', text: metaBodyText };
        if (varNames.length > 0) {
          componentPayload.example = {
            body_text: [exampleValues.length === varNames.length ? exampleValues : varNames.map((_, i) => i === 0 ? 'Juan' : 'Impresora 3D')]
          };
        }`;
code = code.replace(postLogicFind, postLogicReplace);

fs.writeFileSync('backend/src/index.ts', code);
console.log("Backend patched to accept dynamic examples from frontend");
