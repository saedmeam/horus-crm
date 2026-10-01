const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

const startStr = "const handleSelectMetaTemplate = (t: any) => {";
const endStr = "  return (";

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    const extractedCode = code.substring(startIndex, endIndex);
    
    // Remove it from its current position
    code = code.substring(0, startIndex) + code.substring(endIndex);

    // Now insert it before handleSendMessage
    const targetStr = "  const handleSendMessage = async (e: React.FormEvent) => {";
    const targetIndex = code.indexOf(targetStr);
    
    if (targetIndex !== -1) {
       code = code.substring(0, targetIndex) + extractedCode + "\n" + code.substring(targetIndex);
       fs.writeFileSync('frontend/src/app/page.tsx', code);
       console.log("Functions moved to correct scope!");
    } else {
       console.log("Could not find handleSendMessage");
    }
} else {
    console.log("Could not find the functions to extract");
}
