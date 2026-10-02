const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MainSidebar.tsx', 'utf8');

code = code.replace(/const isAdmin = user\.role === 'SUPERADMIN' \|\| user\.role === 'ADMIN';/g, `const isAdmin = user?.role === 'SUPERADMIN' || user?.role?.name === 'SUPERADMIN' || user?.roleData?.name === 'SUPERADMIN';`);

code = code.replace(/\{menuItems\.map\(\(item\) => \{/g, `{menuItems.filter(item => {
              if (isAdmin) return true;
              if (!user?.roleData?.screenAccess) {
                 if (item.href.startsWith('/admin')) return false;
                 return true;
              }
              return user.roleData.screenAccess.includes(item.href);
            }).map((item) => {`);

fs.writeFileSync('frontend/src/components/MainSidebar.tsx', code);
console.log('Sidebar patched.');
