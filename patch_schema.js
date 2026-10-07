const fs = require('fs');
let schema = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

if (!schema.includes('collaboratingIn')) {
  schema = schema.replace(
    'conversations    Conversation[]',
    'conversations    Conversation[]\n  collaboratingIn  Conversation[] @relation("ConversationCollaborators")'
  );
  
  schema = schema.replace(
    'assignedUser     User?              @relation(fields: [assignedUserId], references: [id])',
    'assignedUser     User?              @relation(fields: [assignedUserId], references: [id])\n  collaborators    User[]             @relation("ConversationCollaborators")'
  );

  fs.writeFileSync('backend/prisma/schema.prisma', schema);
  console.log('Schema updated.');
} else {
  console.log('Schema already has collaborators relation.');
}
