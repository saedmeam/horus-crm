const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('C:/Users/horustech/Downloads/Menu.xlsx');

// 1. Clientes
const clientesSheet = xlsx.utils.sheet_to_json(workbook.Sheets['Clientes SM'] || workbook.Sheets['Clientes']);
const clientesMap = {}; // ID Cliente -> db record mapped data
const clientesData = clientesSheet.map(c => {
  const id = c['ID Cliente'];
  const empresa = c['Empresa'] || c['Nombre'] || 'Sin Nombre';
  const email = c['Correo'] || null;
  const phone = c['Telefono'] || null;
  const city = c['Ciudad'] || null;
  const address = c['Direccion'] || null;
  
  const obj = { id, empresa, email, phone, city, address };
  clientesMap[id] = obj;
  return obj;
});

// 2. Equipos
const equiposSheet = xlsx.utils.sheet_to_json(workbook.Sheets['Equipos']);
const equiposData = equiposSheet.map(e => {
  return {
    clientIdExcel: e['ID Cliente'],
    name: e['Nombre Equipo'] || 'Equipo Genérico',
    brand: e['Marca'] || null,
    model: e['Modelo'] || null,
    serial: e['Serie'] ? String(e['Serie']) : null
  };
});

// 3. Tipos de Incidencia
const serviciosSheet = xlsx.utils.sheet_to_json(workbook.Sheets['Servicios SM']);
const incidentTypes = serviciosSheet.map(s => s['Tipo']).filter(Boolean);

// 4. Tipos de Tareas
const tareasSheet = xlsx.utils.sheet_to_json(workbook.Sheets['Tareas SM']);
const taskTypes = tareasSheet.map(t => t['Tipo']).filter(Boolean);

const tsCode = `
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando importación desde Excel...');

  const clientes = ${JSON.stringify(clientesData, null, 2)};
  const equipos = ${JSON.stringify(equiposData, null, 2)};
  const incidentTypes = ${JSON.stringify(incidentTypes, null, 2)};
  const taskTypes = ${JSON.stringify(taskTypes, null, 2)};

  // 1. Tipos de Incidencia
  for (const name of incidentTypes) {
    const exists = await prisma.helpdeskIncidentType.findFirst({ where: { name } });
    if (!exists) {
      await prisma.helpdeskIncidentType.create({ data: { name } });
    }
  }
  console.log('✅ Tipos de Incidencia listos.');

  // 2. Tipos de Tareas
  for (const name of taskTypes) {
    const exists = await prisma.helpdeskTaskType.findFirst({ where: { name } });
    if (!exists) {
      await prisma.helpdeskTaskType.create({ data: { name } });
    }
  }
  console.log('✅ Tipos de Tareas listos.');

  // 3. Clientes y Equipos
  const clientDbMap = new Map(); // ID Cliente Excel -> UUID BD
  
  for (const c of clientes) {
    let dbClient = await prisma.helpdeskClient.findFirst({ where: { name: c.empresa } });
    if (!dbClient) {
      dbClient = await prisma.helpdeskClient.create({
        data: {
          name: c.empresa,
          email: c.email,
          phone: String(c.phone || ''),
          city: c.city,
          address: c.address
        }
      });
    }
    clientDbMap.set(c.id, dbClient.id);
  }
  console.log('✅ Clientes listos.');

  for (const eq of equipos) {
    const dbClientId = clientDbMap.get(eq.clientIdExcel);
    if (dbClientId) {
      const exists = await prisma.helpdeskEquipment.findFirst({ 
        where: { name: eq.name, serial: eq.serial, clientId: dbClientId } 
      });
      if (!exists) {
        await prisma.helpdeskEquipment.create({
          data: {
            name: eq.name,
            brand: eq.brand,
            model: eq.model,
            serial: eq.serial,
            clientId: dbClientId
          }
        });
      }
    }
  }
  console.log('✅ Equipos listos.');

  console.log('🎉 IMPORTACIÓN COMPLETADA 🎉');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;

fs.writeFileSync('src/import_excel.ts', tsCode);
console.log('Script de importacion generado en backend/src/import_excel.ts');
