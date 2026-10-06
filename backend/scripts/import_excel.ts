
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando importación desde Excel...');

  const clientes = [
  {
    "id": "IDCLSM0001",
    "empresa": "IMAGENES TESLA",
    "email": null,
    "phone": null,
    "city": "Babahoyo",
    "address": null
  },
  {
    "id": "IDCLSM0002",
    "empresa": "MACROSALUD S.A.",
    "email": "tania.aguilar@cerid.com.ec",
    "phone": "045120999",
    "city": "Guayaquil",
    "address": "CDLA. ALAMOS 1 MZ. B SL. 3"
  },
  {
    "id": "IDCLSM0003",
    "empresa": "APROFE ASOCIACION PRO BIENESTAR DE LA FAMILIA ECUATORIANA",
    "email": "anavarro@aprofe.org.ec",
    "phone": null,
    "city": "Guayaquil",
    "address": "GUAYAS / GUAYAQUIL / AYACUCHO / LETAMENDI 602 Y NOGUCHI"
  },
  {
    "id": "IDCLSM0004",
    "empresa": "CENTRO DE SERVICIOS MEDICOS SAN FRANCISCO CEMEFRAN C.A.",
    "email": "compras@hospitalsanfrancisco.com.ec",
    "phone": null,
    "city": "Guayaquil",
    "address": "GUAYAS / GUAYAQUIL / TARQUI / AV. ALEJANDRO ANDRADE 27-29 Y JUAN ROLANDO COELLO"
  },
  {
    "id": "IDCLSM0005",
    "empresa": "ASISRAD S.A.S",
    "email": "mariaaugustaleon@gmail.com",
    "phone": "0995127032",
    "city": "Cuenca",
    "address": "Calle Miguel Moreno 6-71 y Luis Cordero diagonal a Alquileres Argudo"
  },
  {
    "id": "IDCLSM0006",
    "empresa": "BOLGROUP S.A.",
    "email": "clinicaborj1990@gmail.com",
    "phone": null,
    "city": "Guayaquil",
    "address": "Kennedy norte mz 701 solar 8-9-10"
  },
  {
    "id": "IDCLSM0007",
    "empresa": "FACTOR INTEGRAL MEDIC INTEGRALMEDIC S.A.S.",
    "email": null,
    "phone": "+593 98 952 7721",
    "city": "Guayaquil",
    "address": "Nueva Kennedy Av. Olimpo #204 entre calle E y D, Frente al parque de Kennedy Norte"
  },
  {
    "id": "IDCLSM0008",
    "empresa": "PETCI S.A.S.",
    "email": "ivetteluzuriagab@gmail.com",
    "phone": null,
    "city": "Quito",
    "address": "La Mariscal E5 9 de Octubre N23-17 diagonal a Consultorios Pichincha"
  },
  {
    "id": "IDCLSM0009",
    "empresa": "INSTITUTO DE DIAGNOSTICO RADIOLOGICO ASOCIADO - INDRA S.A.",
    "email": "indra.rayosx@gmail.com",
    "phone": null,
    "city": "Guayaquil",
    "address": "ZONA 8/ GUAYAS/ GUAYAQUIL"
  },
  {
    "id": "IDCLSM0010",
    "empresa": "CLINICA DE OSTEOPOROSIS S.C.C.",
    "email": "facturas.osteo@osteoporosis.com.ec",
    "phone": "02-2258322",
    "city": "Quito",
    "address": "AV 10 DE AGOSTO N48-68"
  },
  {
    "id": "IDCLSM0011",
    "empresa": "CORPORACIÓN HACIA UN NUEVO ESTILO DE VIDA HUNEV S.A.",
    "email": "sistemas@dralbuja.com",
    "phone": 5000960,
    "city": "Quito",
    "address": "AV. AMAZONAS N44-32 Y RIO COCA"
  },
  {
    "id": "IDCLSM0012",
    "empresa": "IMÁGENES DIAGNOSTICAS CRUZ ROCA SANANGO CROCSAN S.A.S.",
    "email": "umedix10@gmail.com",
    "phone": "0991322786",
    "city": "Guayaquil",
    "address": "Calle Bolivia #715 y Noguchi Mz. 55 Solar 2, a tres cuadras del Hospital Alcivar"
  },
  {
    "id": "IDCLSM0013",
    "empresa": "Gordillo Montenegro Victoria Elizabeth",
    "email": "vickygordillom@yahoo.com",
    "phone": 42233033,
    "city": "Guayaquil",
    "address": "Guayaquil, Alborada 3ra Etapa Mx CC Solar 3, planta baja"
  },
  {
    "id": "IDCLSM0014",
    "empresa": "OROZCO ÁLVAREZ JIMMY ENRIQUE",
    "email": "radiologic34@hotmail.com",
    "phone": "0999557860",
    "city": "Babahoyo",
    "address": "Babahoyo"
  },
  {
    "id": "IDCLSM0015",
    "empresa": "SAVID S.A.S.",
    "email": "vlopez-89@hotmail.com",
    "phone": "0999436725",
    "city": "Daule",
    "address": "LA JOYA, VIAL 1, FRENTE A ETAPA ORO Y GEMA, CC LA VIENNA"
  },
  {
    "id": "IDCLSM0016",
    "empresa": "EUROTEMPO S.A.",
    "email": "administracionsur@medikal.com.ec",
    "phone": null,
    "city": "Guayaquil",
    "address": "GARZOTA"
  },
  {
    "id": "IDCLSM0017",
    "empresa": "SERVICIOS MEDICOS HOSPITALARIOS MEDINA-HOSPITAL CIA.LTDA.",
    "email": "jessicasolorzano.js@gmail.com",
    "phone": "042684203",
    "city": "Guayaquil",
    "address": "Kennedy Norte solar 14 manzana 401"
  },
  {
    "id": "IDCLSM0018",
    "empresa": "FUNDACION TIERRA NUEVA",
    "email": "adquisicionesftn@fundaciontierranueva.org.ec",
    "phone": "0995913480",
    "city": "Quito",
    "address": "Av. Rumichaca S33-10 y Matilde Álvarez"
  },
  {
    "id": "IDCLSM0019",
    "empresa": "Cancertreatmentcenter S.A.",
    "email": "cenoni@hotmail.com",
    "phone": 6009900,
    "city": "Guayaquil",
    "address": "Edificio Equilibrium P7 Ofic 708"
  },
  {
    "id": "IDCLSM0020",
    "empresa": "CARDIOHEREDIA S.A.",
    "email": "info@cardioheredia.com",
    "phone": "042584755",
    "city": "Samborondón",
    "address": null
  },
  {
    "id": "IDCLSM0021",
    "empresa": "CENTRO RADIOLOGICO ROCAFUERTE Y ORRICO",
    "email": null,
    "phone": null,
    "city": "GUARANDA",
    "address": null
  },
  {
    "id": "IDCLSM0022",
    "empresa": "FUNDAMEDIC S.A.",
    "email": null,
    "phone": null,
    "city": "GUAYAQUIL",
    "address": null
  },
  {
    "id": "IDCLSM0023",
    "empresa": "MEDIGLOBAL S.A.",
    "email": null,
    "phone": null,
    "city": "GUAYAQUIL",
    "address": null
  },
  {
    "id": "IDCLSM0024",
    "empresa": "FMT Solutions",
    "email": "fmtsolutions8@gmail.com",
    "phone": "0962578726",
    "city": "Guayaquil",
    "address": "Guayaquil Norte"
  }
];
  const equipos = [
  {
    "clientIdExcel": "IDCLSM0001",
    "name": "RIS-PACS",
    "brand": "RIS",
    "model": "PACS",
    "serial": "1122"
  },
  {
    "clientIdExcel": "IDCLSM0002",
    "name": "RIS-PACS",
    "brand": "ACTUALPACS",
    "model": null,
    "serial": null
  },
  {
    "clientIdExcel": "IDCLSM0003",
    "name": "RIS-PACS",
    "brand": "ACTUALPACS",
    "model": null,
    "serial": null
  },
  {
    "clientIdExcel": "IDCLSM0004",
    "name": "RIS-PACS",
    "brand": "ACTUALPACS",
    "model": null,
    "serial": null
  },
  {
    "clientIdExcel": "IDCLSM0005",
    "name": "RIS-PACS",
    "brand": "HORUSPACS",
    "model": null,
    "serial": null
  },
  {
    "clientIdExcel": "IDCLSM0006",
    "name": "RIS-PACS",
    "brand": "ACTUALPACS",
    "model": null,
    "serial": null
  },
  {
    "clientIdExcel": "IDCLSM0007",
    "name": "RIS-PACS",
    "brand": "ACTUALPACS",
    "model": null,
    "serial": null
  },
  {
    "clientIdExcel": "IDCLSM0008",
    "name": "RIS-PACS",
    "brand": "ACTUALPACS",
    "model": null,
    "serial": null
  },
  {
    "clientIdExcel": "IDCLSM0009",
    "name": "RIS-PACS",
    "brand": "HP",
    "model": "EliteDesk 800 G2",
    "serial": "2UA6271SMJ"
  },
  {
    "clientIdExcel": "IDCLSM0010",
    "name": "RIS-PACS",
    "brand": "ACTUALPACS",
    "model": null,
    "serial": null
  },
  {
    "clientIdExcel": "IDCLSM0011",
    "name": "RIS-PACS",
    "brand": "ACTUALPACS",
    "model": null,
    "serial": null
  },
  {
    "clientIdExcel": "IDCLSM0012",
    "name": "RIS-PACS",
    "brand": "HORUSPACS by ACTUALPACS",
    "model": null,
    "serial": null
  },
  {
    "clientIdExcel": "IDCLSM0013",
    "name": "RIS-PACS",
    "brand": "HORUSPACS by ACTUALPACS",
    "model": null,
    "serial": null
  },
  {
    "clientIdExcel": "IDCLSM0014",
    "name": "RIS-PACS",
    "brand": "HORUSPACS by ACTUALPACS",
    "model": null,
    "serial": null
  },
  {
    "clientIdExcel": "IDCLSM0008",
    "name": "ALMA WORK STATION",
    "brand": "ALMA",
    "model": null,
    "serial": null
  },
  {
    "clientIdExcel": "IDCLSM0015",
    "name": "RIS-PACS",
    "brand": "HORUSPACS by ACTUALPACS",
    "model": null,
    "serial": null
  },
  {
    "clientIdExcel": "IDCLSM0016",
    "name": "RIS-PACS",
    "brand": "ACTUALPACS",
    "model": null,
    "serial": null
  },
  {
    "clientIdExcel": "IDCLSM0017",
    "name": "RIS-PACS",
    "brand": "ACTUALPACS",
    "model": null,
    "serial": null
  },
  {
    "clientIdExcel": "IDCLSM0016",
    "name": "Flat Panel",
    "brand": "LG",
    "model": "14HQ701G",
    "serial": "408KCLHKK744"
  },
  {
    "clientIdExcel": "IDCLSM0018",
    "name": "RIS-PACS",
    "brand": "HORUSPACS",
    "model": null,
    "serial": null
  },
  {
    "clientIdExcel": "IDCLSM0013",
    "name": "Monitor de Grado Médico de Diagnóstico 8MP",
    "brand": "LG",
    "model": "32HQ713D",
    "serial": "507NTZNNY805"
  },
  {
    "clientIdExcel": "IDCLSM0019",
    "name": "RIS-PACS",
    "brand": "EDEN-PACS",
    "model": null,
    "serial": null
  },
  {
    "clientIdExcel": "IDCLSM0020",
    "name": "RIS-PACS",
    "brand": "ACTUALPACS",
    "model": null,
    "serial": null
  },
  {
    "clientIdExcel": "IDCLSM0021",
    "name": "RIS-PACS",
    "brand": "HORUSPACS by ACTUALPACS",
    "model": null,
    "serial": "N/A"
  },
  {
    "clientIdExcel": "IDCLSM0022",
    "name": "RIS-PACS",
    "brand": "ACTUALPACS",
    "model": null,
    "serial": null
  },
  {
    "clientIdExcel": "IDCLSM0023",
    "name": "RIS-PACS",
    "brand": "ACTUALPACS",
    "model": null,
    "serial": null
  },
  {
    "clientIdExcel": "IDCLSM0024",
    "name": "SIEMENS",
    "brand": "ANGIO",
    "model": "ARTIS",
    "serial": "1234"
  }
];
  const incidentTypes = [
  "Incidencia Operativa",
  "Soporte Correctivo",
  "Soporte Preventivo",
  "Implementación",
  "Capacitación",
  "Actualización / Upgrade",
  "Integración / Interoperabilidad",
  "Requerimiento del Cliente",
  "Seguimiento a Cliente"
];
  const taskTypes = [
  "Instalación de Software",
  "Configuración del Sistema",
  "Configuración de Modalidades",
  "Integración con Sistemas Externos",
  "Pruebas / Validación",
  "Corrección de Error",
  "Análisis / Diagnóstico",
  "Capacitación al Usuario",
  "Documentación / Informe",
  "Soporte / Asistencia",
  "Creación/Edición de Grupo/Usuario"
];

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
    // process.exit(1); removed to fix TS error
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
