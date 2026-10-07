const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

const regex = /if\s*\(statusFilter\s*===\s*'UNASSIGNED'\s*&&\s*c\.assignedUserId\)\s*return\s*false;\s*if\s*\(statusFilter\s*!==\s*'ALL'\s*&&\s*statusFilter\s*!==\s*'UNASSIGNED'\s*&&\s*c\.status\s*!==\s*statusFilter\)\s*return\s*false;\s*return\s*true;/;

const newFilterLogic = `if (statusFilter === 'ASSIGNED_TO_ME') {
                    if (c.assignedUserId !== user?.id) return false;
                  } else if (statusFilter === 'UNASSIGNED') {
                    if (c.assignedUserId) return false;
                  } else if (statusFilter !== 'ALL') {
                    if (c.status !== statusFilter) return false;
                  }
                  return true;`;

if (code.match(regex)) {
    code = code.replace(regex, newFilterLogic);
    console.log('Filter logic patched via regex');
    fs.writeFileSync('frontend/src/app/page.tsx', code);
} else {
    console.log('Filter logic STILL NOT matched');
}
