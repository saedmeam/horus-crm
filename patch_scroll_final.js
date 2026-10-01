const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

// Replace scrollToBottom function completely
const regex = /const scrollToBottom = \(smooth = true\) => \{[\s\S]*?\}, \[messages\]\);/g;

const replacement = `const scrollToBottom = (behavior: 'auto' | 'smooth' = 'auto') => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
      }
    }, 150);
  };
  
  require('react').useEffect(() => {
    // Solo scrollear cuando tenemos mensajes cargados
    if (messages && messages.length > 0) {
      scrollToBottom('auto');
    }
  }, [selectedChat, messages]);`;

code = code.replace(regex, replacement);

// Replace onScroll logic to be safer
const onScrollRegex = /onScroll=\{\(e\) => \{[\s\S]*?setShowScrollDown\(target\.scrollHeight - target\.scrollTop - target\.clientHeight > 150\);\s*\}\}/g;
const onScrollRepl = `onScroll={(e) => {
    const target = e.currentTarget;
    setShowScrollDown(target.scrollHeight - target.scrollTop - target.clientHeight > 150);
  }}`;
code = code.replace(onScrollRegex, onScrollRepl);

// Fix the button onClick
const btnRegex = /onClick=\{\(\) => scrollToBottom\(true\)\}/g;
code = code.replace(btnRegex, "onClick={() => scrollToBottom('smooth')}");

fs.writeFileSync('frontend/src/app/page.tsx', code);
console.log('Fixed auto-scroll behavior and button!');
