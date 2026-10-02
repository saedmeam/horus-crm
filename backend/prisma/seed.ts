import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Seeding de Base de Datos ---');

  // 1. Crear roles base (idempotente)
  const adminScreens = ['/', '/contacts', '/kanban', '/recordatorios', '/admin/configuracion', '/admin/users', '/admin/roles', '/admin/lines', '/admin/snippets', '/admin/kanban-settings', '/admin/contact-fields', '/admin/pedidos', '/admin/plantillas', '/admin/notificaciones'];

  let superRole = await prisma.role.findUnique({ where: { name: 'SUPERADMIN' } });
  if (!superRole) {
    superRole = await prisma.role.create({
      data: { name: 'SUPERADMIN', canViewAllChats: true, screenAccess: adminScreens }
    });
    console.log('Rol SUPERADMIN creado');
  }

  let adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: { name: 'ADMIN', canViewAllChats: true, screenAccess: adminScreens }
    });
    console.log('Rol ADMIN creado');
  }

  // 2. Crear línea de WhatsApp principal (solo si hay un phone number id real)
  const phoneId = process.env.DEFAULT_PHONE_NUMBER_ID || '';
  let line: any = null;
  if (phoneId && phoneId !== 'NO_PHONE_ID_SET') {
    line = await prisma.whatsAppLine.findUnique({ where: { phoneNumberId: phoneId } });
    if (!line) {
      line = await prisma.whatsAppLine.create({
        data: { phoneNumberId: phoneId, name: 'WhatsApp Principal', active: true }
      });
      console.log(`Línea WhatsApp creada: ${line.name} (${phoneId})`);
    } else {
      console.log(`Línea WhatsApp ya existía: ${line.name}`);
    }
  } else {
    console.log('Sin DEFAULT_PHONE_NUMBER_ID configurado; se omite la creación de línea.');
  }

  // 3. Crear usuario administrador (idempotente)
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@horustech.com';
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'horustech2026';

  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        username: adminUsername,
        name: 'SuperAdmin Horustech',
        passwordHash,
        roleId: superRole.id,
        active: true,
        ...(line ? { lines: { connect: { id: line.id } } } : {})
      }
    });
    console.log(`Usuario administrador creado: ${adminEmail} / ${adminUsername}`);
  } else {
    console.log(`Usuario administrador ya existía: ${adminEmail}`);
    const updateData: any = { roleId: superRole.id, username: adminUsername };
    if (line) updateData.lines = { connect: { id: line.id } };
    await prisma.user.update({ where: { id: admin.id }, data: updateData });
    console.log('Rol, usuario y línea del administrador actualizados.');
  }

  console.log('--- Seeding Terminado ---');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });