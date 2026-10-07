const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

// 1. Update whereClause in GET /api/conversations
const oldWhere = `const whereClause = isAdmin ? {} : {
          OR: [
            { assignedUserId: user.id },
            { 
              assignedUserId: null, 
              whatsappLineId: { in: lineIds }
            },
            {
              assignedUserId: null,
              whatsappLineId: null
            }
          ]
        };`;

const newWhere = `const whereClause = isAdmin ? {} : {
          OR: [
            { assignedUserId: user.id },
            { collaborators: { some: { id: user.id } } },
            { 
              assignedUserId: null, 
              whatsappLineId: { in: lineIds }
            },
            {
              assignedUserId: null,
              whatsappLineId: null
            }
          ]
        };`;

code = code.replace(oldWhere, newWhere);

// Ensure we include collaborators in the response of GET /api/conversations
code = code.replace(
  `include: { contact: true, whatsappLine: true },`,
  `include: { contact: true, whatsappLine: true, collaborators: true },`
);

// 2. Add automatic collaborator addition in comments endpoint
const oldComment = `const comment = await prisma.internalComment.create({
      data: {
        conversationId: req.params.id,
        authorId: req.user.id,
        content,
        mentions: mentions || []
      },
      include: { author: true }
    });`;

const newComment = `const comment = await prisma.internalComment.create({
      data: {
        conversationId: req.params.id,
        authorId: req.user.id,
        content,
        mentions: mentions || []
      },
      include: { author: true }
    });

    // Add author and mentioned users as collaborators
    const collaboratorIds = new Set<string>();
    collaboratorIds.add(req.user.id);
    
    // Attempt to extract mentioned users by username/name
    const allUsersList = await prisma.user.findMany();
    for (const u of allUsersList) {
      if (content.includes('@' + u.name) || content.includes('@' + u.username)) {
        collaboratorIds.add(u.id);
      }
    }

    try {
      await prisma.conversation.update({
        where: { id: req.params.id },
        data: {
          collaborators: {
            connect: Array.from(collaboratorIds).map(id => ({ id }))
          }
        }
      });
      
      const updatedConvForSockets = await prisma.conversation.findUnique({
        where: { id: req.params.id },
        include: { collaborators: true }
      });
      io.emit('chat_collaborators_updated', { conversationId: req.params.id, collaborators: updatedConvForSockets?.collaborators });
    } catch(err) {
      console.error('Error adding automatic collaborator', err);
    }
`;

code = code.replace(oldComment, newComment);

// 3. Add new PUT /api/conversations/:id/collaborators endpoint
const newEndpoint = `
// Actualizar colaboradores manualmente
app.put('/api/conversations/:id/collaborators', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { collaboratorIds } = req.body;
    
    const conversation = await prisma.conversation.update({
      where: { id },
      data: {
        collaborators: {
          set: collaboratorIds.map((cId: string) => ({ id: cId }))
        }
      },
      include: { collaborators: true }
    });
    
    io.emit('chat_collaborators_updated', { conversationId: id, collaborators: conversation.collaborators });
    res.json(conversation);
  } catch (err) {
    console.error('Error updating collaborators', err);
    res.status(500).json({ error: 'Error updating collaborators' });
  }
});
`;

if (!code.includes('/api/conversations/:id/collaborators')) {
  // insert before app.get('/api/conversations'
  code = code.replace(
    /app\.get\('\/api\/conversations', authenticateToken, async/g,
    newEndpoint + "\napp.get('/api/conversations', authenticateToken, async"
  );
}

fs.writeFileSync('backend/src/index.ts', code);
console.log('backend/src/index.ts patched successfully');
