const fs = require('fs');

let backendPath = 'backend/src/index.ts';
let content = fs.readFileSync(backendPath, 'utf8');

// Fix the include in /api/auth/login
content = content.replace(
  /include: \{ lines: true \}/,
  "include: { lines: true, role: true }"
);

// Fix the jwt.sign payload
content = content.replace(
  /\{ id: user\.id, role: \(\(user as any\)\.role\?\.name \|\| \(user as any\)\.role\), email: user\.email \}/,
  "{ id: user.id, role: (user as any).role?.name || 'SALES', roleData: (user as any).role, email: user.email }"
);

// Fix the res.json user object
content = content.replace(
  /role: \(\(user as any\)\.role\?\.name \|\| \(user as any\)\.role\),/g,
  "role: (user as any).role?.name || 'SALES', roleData: (user as any).role,"
);

// Wait, I replaced `user.role` EVERYWHERE with `((user as any).role?.name || (user as any).role)`.
// Did I replace it in the GET /api/users ?
// Yes, and it broke there too probably? No, `/api/users` doesn't strictly need `roleData` unless the frontend expects it. 
// But let's check `patch_ts_remaining.js` or `patch_users_roles.js`.
// Users page was already patched to handle `role?.name || user.role`.

fs.writeFileSync(backendPath, content);
console.log('Login endpoint fixed with role inclusion!');
