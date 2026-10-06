const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Loading Excel file...');
  const wb = xlsx.readFile('C:/Users/horustech/Downloads/Menu.xlsx');
  
  // 1. Clients
  console.log('Seeding Clientes SM...');
  const clientsData = xlsx.utils.sheet_to_json(wb.Sheets['Clientes SM']);
  for (const c of clientsData) {
    if (!c['ID Cliente']) continue;
    await prisma.helpdeskClient.upsert({
      where: { id: c['ID Cliente'].toString() },
      update: {
        name: c['Empresa'] || c['Nombre'] || 'Sin Nombre',
        email: c['Correo'] ? c['Correo'].toString() : null,
        phone: c['Telefono'] ? c['Telefono'].toString() : null,
        city: c['Ciudad'] ? c['Ciudad'].toString() : null,
        address: c['Direccion'] ? c['Direccion'].toString() : null
      },
      create: {
        id: c['ID Cliente'].toString(),
        name: c['Empresa'] || c['Nombre'] || 'Sin Nombre',
        email: c['Correo'] ? c['Correo'].toString() : null,
        phone: c['Telefono'] ? c['Telefono'].toString() : null,
        city: c['Ciudad'] ? c['Ciudad'].toString() : null,
        address: c['Direccion'] ? c['Direccion'].toString() : null
      }
    });
  }

  // 2. Equipments
  console.log('Seeding Equipos...');
  const equipData = xlsx.utils.sheet_to_json(wb.Sheets['Equipos']);
  for (const e of equipData) {
    if (!e['ID Equipo'] || !e['ID Cliente']) continue;
    
    const clientExists = await prisma.helpdeskClient.findUnique({ where: { id: e['ID Cliente'].toString() } });
    if (!clientExists) continue;

    await prisma.helpdeskEquipment.upsert({
      where: { id: e['ID Equipo'].toString() },
      update: {
        name: e['Nombre Equipo'] || 'Equipo Genérico',
        brand: e['Marca'] ? e['Marca'].toString() : null,
        model: e['Modelo'] ? e['Modelo'].toString() : null,
        serial: e['Serie'] ? e['Serie'].toString() : null,
        clientId: e['ID Cliente'].toString()
      },
      create: {
        id: e['ID Equipo'].toString(),
        name: e['Nombre Equipo'] || 'Equipo Genérico',
        brand: e['Marca'] ? e['Marca'].toString() : null,
        model: e['Modelo'] ? e['Modelo'].toString() : null,
        serial: e['Serie'] ? e['Serie'].toString() : null,
        clientId: e['ID Cliente'].toString()
      }
    });
  }

  // 3. Incident Types
  console.log('Seeding Servicios SM (Tipos de Incidencia)...');
  const incidentData = xlsx.utils.sheet_to_json(wb.Sheets['Servicios SM']);
  for (const s of incidentData) {
    if (!s['Id Servicio'] || !s['Tipo']) continue;
    await prisma.helpdeskIncidentType.upsert({
      where: { id: s['Id Servicio'].toString() },
      update: { name: s['Tipo'].toString() },
      create: { id: s['Id Servicio'].toString(), name: s['Tipo'].toString() }
    });
  }

  // 4. Task Types
  console.log('Seeding Tareas SM (Tipos de Tareas)...');
  const taskData = xlsx.utils.sheet_to_json(wb.Sheets['Tareas SM']);
  for (const t of taskData) {
    if (!t['Id Tarea'] || !t['Tipo']) continue;
    await prisma.helpdeskTaskType.upsert({
      where: { id: t['Id Tarea'].toString() },
      update: { name: t['Tipo'].toString() },
      create: { id: t['Id Tarea'].toString(), name: t['Tipo'].toString() }
    });
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
