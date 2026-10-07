const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

// 1. Fix whereClause
const regexWhere = /const whereClause = isAdmin \? \{\} : \{\s*OR: \[\s*\{ assignedUserId: user\.id \},\s*\{/g;
if (code.match(regexWhere)) {
  code = code.replace(regexWhere, `const whereClause = isAdmin ? {} : {
        OR: [
          { assignedUserId: user.id },
          { collaborators: { some: { id: user.id } } },
          {`);
  console.log('whereClause patched successfully');
} else {
  console.log('whereClause NOT patched! Regex failed.');
}

// 2. Fix findMany include
const regexFindMany = /const conversations = await prisma\.conversation\.findMany\(\{[\s\S]*?include: \{[\s\S]*?contact: true,/g;
if (code.match(regexFindMany)) {
  code = code.replace(/include: \{\s*contact: true,/g, `include: {\n        collaborators: true,\n        contact: true,`);
  console.log('findMany include patched successfully');
} else {
  console.log('findMany include NOT patched! Regex failed.');
}

fs.writeFileSync('backend/src/index.ts', code);
