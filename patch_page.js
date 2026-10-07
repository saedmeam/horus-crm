const fs = require('fs');

let f = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

f = f.replace(
  /if \(res\.ok\) \{\s*setSelectedChat\(\(prev: any\) => \(\{ \.\.\.prev, assignedUserId: userId \}\)\);\s*setConversations\(prev => prev\.map\(c => c\.id === selectedChat\.id \? \{ \.\.\.c, assignedUserId: userId \} : c\)\);\s*setShowAssignDropdown\(false\);\s*toast\.success\(userId \? 'Chat asignado correctamente' : 'Chat liberado'\);\s*\}/,
  `if (res.ok) {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        const isAdmin = u.role === 'SUPERADMIN' || u.role === 'ADMIN';

        if (!isAdmin && userId !== null && userId !== u.id) {
          setSelectedChat(null);
        } else {
          setSelectedChat((prev: any) => prev ? { ...prev, assignedUserId: userId } : prev);
        }
        
        fetchConversations();
        setShowAssignDropdown(false);
        toast.success(userId ? 'Chat asignado correctamente' : 'Chat liberado');
      }`
);

fs.writeFileSync('frontend/src/app/page.tsx', f);
console.log('page.tsx patched successfully');
