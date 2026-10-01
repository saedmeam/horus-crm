const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

// 1. Add states/refs
const statesAnchor = "const [reminderTime, setReminderTime] = useState('');";
const newStates = `const messagesEndRef = require('react').useRef<HTMLDivElement>(null);
  const chatScrollRef = require('react').useRef<HTMLDivElement>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  require('react').useEffect(() => {
    scrollToBottom();
  }, [messages, selectedChat]);`;

code = code.replace(statesAnchor, statesAnchor + '\n  ' + newStates);

// 2. Add scroll listener
const divAnchor = '<div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 relative z-10 flex flex-col">';
const divRepl = `<div 
  className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 relative z-10 flex flex-col"
  ref={chatScrollRef}
  onScroll={(e) => {
    const target = e.target;
    setShowScrollDown(target.scrollHeight - target.scrollTop - target.clientHeight > 150);
  }}
>`;
code = code.replace(divAnchor, divRepl);

// 3. Add dummy div and button
const endDivAnchor = `                      })}
                    </div>`;
const endDivRepl = `                      })}
                      <div ref={messagesEndRef} className="h-1 shrink-0" />
                    </div>
                    {showScrollDown && (
                      <button
                        onClick={scrollToBottom}
                        className="absolute bottom-24 right-4 p-3 bg-white dark:bg-[#202c33] text-gray-600 dark:text-gray-300 rounded-full shadow-lg border border-gray-200 dark:border-[#2a3942] z-50 hover:text-blue-500 transition-all"
                        title="Bajar al último mensaje"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                      </button>
                    )}`;
code = code.replace(endDivAnchor, endDivRepl);

fs.writeFileSync('frontend/src/app/page.tsx', code);
console.log('Successfully injected scroll to bottom features!');
