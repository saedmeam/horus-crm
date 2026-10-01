const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

const targetRender = `                                      <Check className="w-3 h-3 text-gray-400" />
                                    ) : (
                                      <Check className="w-3 h-3 text-gray-300" />
                                    )}`;

const replRender = `                                      <Check className="w-3 h-3 text-gray-400" />
                                    ) : msg.status === 'FAILED' ? (
                                      <X className="w-3 h-3 text-red-500" title="Error de envío (Meta)" />
                                    ) : (
                                      <Check className="w-3 h-3 text-gray-300" />
                                    )}`;

code = code.replace(targetRender, replRender);
fs.writeFileSync('frontend/src/app/page.tsx', code);
console.log('Added FAILED status icon!');
