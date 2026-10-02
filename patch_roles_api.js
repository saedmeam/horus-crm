const fs = require('fs');
let code = fs.readFileSync('backend/src/index.ts', 'utf8');

const roleRoutes = `
// --- ROLES ---
app.get('/api/roles', authenticateToken, async (req, res) => {
  try {
    const roles = await prisma.role.findMany({ include: { _count: { select: { users: true } } } });
    res.json(roles);
  } catch (e) {
    res.status(500).json({ error: 'Error fetching roles' });
  }
});

app.post('/api/roles', authenticateToken, async (req, res) => {
  try {
    const { name, canViewAllChats, screenAccess } = req.body;
    const role = await prisma.role.create({
      data: { name, canViewAllChats, screenAccess }
    });
    res.json(role);
  } catch (e) {
    res.status(500).json({ error: 'Error creating role' });
  }
});

app.put('/api/roles/:id', authenticateToken, async (req, res) => {
  try {
    const { name, canViewAllChats, screenAccess } = req.body;
    const role = await prisma.role.update({
      where: { id: req.params.id },
      data: { name, canViewAllChats, screenAccess }
    });
    res.json(role);
  } catch (e) {
    res.status(500).json({ error: 'Error updating role' });
  }
});

app.delete('/api/roles/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.role.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Error deleting role' });
  }
});
`;

code = code.replace(/\/\/ --- Conversation Routes ---/, roleRoutes + '\n// --- Conversation Routes ---');
fs.writeFileSync('backend/src/index.ts', code);
console.log('Added role routes.');
