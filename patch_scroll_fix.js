const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

const targetRegex = /const scrollToBottom = \(\) => \{\s*messagesEndRef\.current\?\.scrollIntoView\(\{ behavior: 'smooth' \}\);\s*\};\s*require\('react'\)\.useEffect\(\(\) => \{\s*scrollToBottom\(\);\s*\}, \[messages, selectedChat\]\);/g;

const replacement = `const scrollToBottom = (smooth = true) => {
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTo({
          top: chatScrollRef.current.scrollHeight,
          behavior: smooth ? 'smooth' : 'auto'
        });
      }
    }, 100);
  };
  
  require('react').useEffect(() => {
    scrollToBottom(false);
  }, [selectedChat]);

  require('react').useEffect(() => {
    scrollToBottom(true);
  }, [messages]);`;

code = code.replace(targetRegex, replacement);

// Also need to fix the button to call `scrollToBottom(true)` instead of `scrollToBottom` if it passes an event. Actually `onClick={() => scrollToBottom(true)}` is safer.
const btnRegex = /onClick=\{scrollToBottom\}/g;
code = code.replace(btnRegex, "onClick={() => scrollToBottom(true)}");

fs.writeFileSync('frontend/src/app/page.tsx', code);
console.log('Fixed scrollToBottom logic');
