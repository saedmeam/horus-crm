const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create Superadmin role
  let superRole = await prisma.role.findUnique({ where: { name: 'SUPERADMIN' } });
  if (!superRole) {
    superRole = await prisma.role.create({
      data: {
        name: 'SUPERADMIN',
        canViewAllChats: true,
        screenAccess: ["/dashboard", "/contacts", "/settings", "/admin/usuarios", "/admin/roles", "/admin/configuracion"]
      }
    });
  }

  // Create Admin role
  let adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        name: 'ADMIN',
        canViewAllChats: true,
        screenAccess: ["/dashboard", "/contacts", "/settings", "/admin/usuarios", "/admin/configuracion"]
      }
    });
  }
  
  // Find users and assign them a role if they don't have one
  const users = await prisma.user.findMany({ where: { roleId: null } });
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { roleId: superRole.id }
    });
  }
  
  console.log("Seeding complete.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
