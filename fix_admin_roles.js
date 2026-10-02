const fs = require('fs');

let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');
code = code.replace(
  /const canViewAll = currentUser\?\.roleData\?\.canViewAllChats === true \|\| currentUser\?\.role\?\.name === 'SUPERADMIN' \|\| currentUser\?\.role === 'SUPERADMIN';/g,
  "const canViewAll = currentUser?.roleData?.canViewAllChats === true || currentUser?.role?.name === 'SUPERADMIN' || currentUser?.role === 'SUPERADMIN' || currentUser?.role?.name === 'ADMIN' || currentUser?.role === 'ADMIN';"
);
fs.writeFileSync('frontend/src/app/page.tsx', code);

code = fs.readFileSync('frontend/src/components/MainSidebar.tsx', 'utf8');
code = code.replace(
  /const isAdmin = user\?\.role === 'SUPERADMIN' \|\| user\?\.role\?\.name === 'SUPERADMIN' \|\| user\?\.roleData\?\.name === 'SUPERADMIN';/g,
  "const isAdmin = user?.role === 'SUPERADMIN' || user?.role?.name === 'SUPERADMIN' || user?.roleData?.name === 'SUPERADMIN' || user?.role === 'ADMIN' || user?.role?.name === 'ADMIN' || user?.roleData?.name === 'ADMIN';"
);
fs.writeFileSync('frontend/src/components/MainSidebar.tsx', code);

console.log('Fixed ADMIN roles in frontend!');
