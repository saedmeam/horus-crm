const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

const helper = `
function formatChatListDate(dateString: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - target.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Ayer';
  } else if (diffDays >= 2 && diffDays <= 6) {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()];
  } else {
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
`;

if (!code.includes('formatChatListDate')) {
  // Insert helper before export default
  code = code.replace('export default function CRMChatLayout() {', helper + '\nexport default function CRMChatLayout() {');
  
  // Replace the rendering logic
  const target = `{chat.messages[0] ? new Date(chat.messages[0].createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}`;
  const replacement = `{chat.messages[0] ? formatChatListDate(chat.messages[0].createdAt) : ''}`;
  
  code = code.replace(target, replacement);
  fs.writeFileSync('frontend/src/app/page.tsx', code);
  console.log('Successfully added formatChatListDate!');
} else {
  console.log('formatChatListDate already exists.');
}
