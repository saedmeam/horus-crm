const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

const targetRegex = /<span className="text-\[10px\] block text-right mt-1 text-gray-500 dark:text-gray-400">([\s\S]*?)<\/span>/g;

const replacer = `<div className="flex justify-end items-center gap-1 mt-1">
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                  $1
                                </span>
                                {(!isClient && !msg.isInternal) && (
                                  <span className="text-[12px] flex items-center">
                                    {msg.status === 'READ' ? (
                                      <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                                    ) : msg.status === 'DELIVERED' ? (
                                      <CheckCheck className="w-3.5 h-3.5 text-gray-400" />
                                    ) : msg.status === 'SENT' ? (
                                      <Check className="w-3.5 h-3.5 text-gray-400" />
                                    ) : msg.status === 'FAILED' ? (
                                      <X className="w-3.5 h-3.5 text-red-500" title="Error" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5 text-gray-300" />
                                    )}
                                  </span>
                                )}
                              </div>`;

code = code.replace(targetRegex, replacer);
fs.writeFileSync('frontend/src/app/page.tsx', code);
console.log('Successfully injected ticks UI!');
