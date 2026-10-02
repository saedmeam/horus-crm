const fs = require('fs');
let code = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

// Replace enum Role
code = code.replace(/enum Role \{[\s\S]*?\}/, `model Role {
  id              String   @id @default(uuid())
  name            String   @unique
  canViewAllChats Boolean  @default(false)
  screenAccess    Json     @default("[]")
  users           User[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}`);

// Replace User role field
code = code.replace(/role\s+Role\s+@default\(SALES\)/, `roleId           String?
  role             Role?    @relation(fields: [roleId], references: [id])`);

fs.writeFileSync('backend/prisma/schema.prisma', code);
console.log('Schema updated.');
