const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

const s = (v) => (v === '' || v === null || v === undefined ? null : String(v).trim() || null);

async function main() {
  console.log('Loading JSON data...');
  const data = JSON.parse(fs.readFileSync('./seed_data.json', 'utf8'));

  // 1. Clients (por code)
  console.log('Seeding Clientes SM...');
  for (const c of data.clients) {
    const code = s(c['ID Cliente']);
    if (!code) continue;
    const payload = {
      code,
      name: c['Empresa'] || c['Nombre'] || 'Sin Nombre',
      company: s(c['Empresa']),
      lastNames: s(c['Apellidos']),
      cedula: s(c['Cedula']),
      email: s(c['Correo']),
      phone: s(c['Telefono']),
      city: s(c['Ciudad']),
      address: s(c['Direccion']),
      businessLine: 'SM'
    };
    const existing = await prisma.helpdeskClient.findFirst({ where: { code } });
    if (existing) await prisma.helpdeskClient.update({ where: { id: existing.id }, data: payload });
    else await prisma.helpdeskClient.create({ data: payload });
  }

  // 2. Equipments (por code)
  console.log('Seeding Equipos...');
  for (const e of data.equipments) {
    const code = s(e['ID Equipo']);
    const clientCode = s(e['ID Cliente']);
    if (!code || !clientCode) continue;

    const client = await prisma.helpdeskClient.findFirst({ where: { code: clientCode } });
    if (!client) continue;

    const payload = {
      code,
      name: e['Nombre Equipo'] || e['Modelo'] || 'Equipo Genérico',
      brand: s(e['Marca']),
      model: s(e['Modelo']),
      serial: s(e['Serie']),
      clientId: client.id,
      businessLine: 'SM'
    };
    const existing = await prisma.helpdeskEquipment.findFirst({ where: { code } });
    if (existing) await prisma.helpdeskEquipment.update({ where: { id: existing.id }, data: payload });
    else await prisma.helpdeskEquipment.create({ data: payload });
  }

  // 3. Incident Types (sin code -> por name + businessLine)
  console.log('Seeding Servicios SM (Tipos de Incidencia)...');
  for (const it of data.incidents) {
    const name = s(it['Tipo']) || s(it['Nombre']);
    if (!name) continue;
    const existing = await prisma.helpdeskIncidentType.findFirst({ where: { name, businessLine: 'SM' } });
    if (!existing) await prisma.helpdeskIncidentType.create({ data: { name, businessLine: 'SM' } });
  }

  // 4. Task Types (por code)
  console.log('Seeding Tareas SM (Tipos de Tareas)...');
  for (const t of data.tasks) {
    const code = s(t['Id Tarea']);
    const name = s(t['Tipo']) || s(t['Nombre']) || s(t['name']);
    if (!code && !name) continue;
    const payload = { name: name || code };
    if (code) payload.code = code;
    payload.businessLine = 'SM';
    const existing = code
      ? await prisma.helpdeskTaskType.findFirst({ where: { code } })
      : await prisma.helpdeskTaskType.findFirst({ where: { name, businessLine: 'SM' } });
    if (existing) await prisma.helpdeskTaskType.update({ where: { id: existing.id }, data: payload });
    else await prisma.helpdeskTaskType.create({ data: payload });
  }

  console.log('Seeding completed!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
