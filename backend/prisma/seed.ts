import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Seeding de Base de Datos ---');

  // 1. Crear Línea de WhatsApp principal (Ventas 1 / Principal)
  const phoneId = process.env.DEFAULT_PHONE_NUMBER_ID || 'NO_PHONE_ID_SET';
  
  let line = await prisma.whatsAppLine.findUnique({
    where: { phoneNumberId: phoneId }
  });

  if (!line) {
    line = await prisma.whatsAppLine.create({
      data: {
        phoneNumberId: phoneId,
        name: 'Ventas Principal (Test)',
        active: true,
      }
    });
    console.log(`Línea WhatsApp creada: ${line.name} (${phoneId})`);
  } else {
    console.log(`Línea WhatsApp ya existía: ${line.name}`);
  }

  // 2. Crear usuario SUPERADMIN
  const adminEmail = 'admin@horustech.com';
  let admin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!admin) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('horustech2026', salt);

    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'SuperAdmin Horustech',
        passwordHash,
        role: 'SUPERADMIN',
        active: true,
        lines: {
          connect: { id: line.id }
        }
      }
    });
    console.log(`Usuario Creado: ${adminEmail} / horustech2026`);
  } else {
    console.log(`Usuario SuperAdmin ya existía: ${adminEmail}`);
    // Asegurarse de que el admin tenga la línea asignada
    await prisma.user.update({
      where: { id: admin.id },
      data: {
        lines: {
          connect: { id: line.id }
        }
      }
    });
    console.log(`Línea reconectada al admin.`);
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

