const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

const target = `                        );
                      })}
                    </div>
                </div>`;

const replacement = `                        );
                      })}
                      <div ref={messagesEndRef} className="h-1 shrink-0" />
                    </div>
                    {showScrollDown && (
                      <button
                        onClick={() => scrollToBottom('smooth')}
                        className="absolute bottom-24 right-4 p-3 bg-white dark:bg-[#202c33] text-gray-600 dark:text-gray-300 rounded-full shadow-lg border border-gray-200 dark:border-[#2a3942] z-50 hover:text-blue-500 transition-all"
                        title="Bajar al último mensaje"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                      </button>
                    )}
                </div>`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('frontend/src/app/page.tsx', code);
  console.log('Successfully injected dummy div and button!');
} else {
  console.log('Target not found in file!');
}
