const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

function toDate(v) {
  if (v === '' || v === null || v === undefined) return null;
  let d;
  if (typeof v === 'number') d = new Date(Math.round((v - 25569) * 86400 * 1000));
  else d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
function s(v) {
  if (v === '' || v === null || v === undefined || v === 0) return '';
  return String(v);
}
function dateStr(v) {
  const d = toDate(v);
  return d ? d.toISOString().split('T')[0] : '';
}

async function main() {
  const file = path.join(__dirname, '..', 'seed_data_3d.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));

  // 1. Clientes 3D
  console.log('Seeding Clientes 3D (' + data.clients.length + ')...');
  for (const c of data.clients) {
    const code = s(c['ID Cliente']);
    if (!code) continue;
    const name = c['Empresa'] || [c['Nombre'], c['Apellidos']].filter(Boolean).join(' ') || 'Sin Nombre';
    const payload = {
      code, cedula: s(c['Cedula']), company: s(c['Empresa']), name,
      lastNames: s(c['Apellidos']), email: s(c['Correo']), phone: s(c['Telefono']),
      city: s(c['Ciudad']), address: s(c['Direccion']), businessLine: '3D'
    };
    const existing = await prisma.helpdeskClient.findFirst({ where: { code } });
    if (existing) await prisma.helpdeskClient.update({ where: { id: existing.id }, data: payload });
    else await prisma.helpdeskClient.create({ data: payload });
  }

  // 2. Equipos 3D
  console.log('Seeding Equipos 3D (' + data.equipments.length + ')...');
  for (const e of data.equipments) {
    const code = s(e['ID Equipo']);
    if (!code) continue;
    const clientCode = s(e['ID Cliente']);
    const client = clientCode ? await prisma.helpdeskClient.findFirst({ where: { code: clientCode } }) : null;
    const payload = {
      code, name: e['Nombre Equipo'] || 'Equipo Genérico', brand: s(e['Marca']),
      model: s(e['Modelo']), serial: s(e['Serie']), clientId: client ? client.id : null, businessLine: '3D'
    };
    const existing = await prisma.helpdeskEquipment.findFirst({ where: { code } });
    if (existing) await prisma.helpdeskEquipment.update({ where: { id: existing.id }, data: payload });
    else await prisma.helpdeskEquipment.create({ data: payload });
  }

  // 3. Servicios
  console.log('Seeding Servicios (' + data.services.length + ')...');
  for (const sv of data.services) {
    const code = s(sv['Id Servicio']);
    if (!code) continue;
    const payload = {
      code, type: s(sv['Tipo']), description: s(sv['Descripcion']),
      flow: s(sv['Flujo asignado']), estimatedPrice: s(sv['Precio Estimado']), businessLine: '3D'
    };
    const existing = await prisma.helpdeskService.findFirst({ where: { code } });
    if (existing) await prisma.helpdeskService.update({ where: { id: existing.id }, data: payload });
    else await prisma.helpdeskService.create({ data: payload });
  }

  // 4. Recepcion
  console.log('Seeding Recepcion (' + data.receptions.length + ')...');
  for (const r of data.receptions) {
    const code = s(r['Id Recepcion']);
    if (!code) continue;
    const payload = { code, name: r['Nombre'] || 'Sin nombre' };
    const existing = await prisma.helpdeskReception.findFirst({ where: { code } });
    if (existing) await prisma.helpdeskReception.update({ where: { id: existing.id }, data: payload });
    else await prisma.helpdeskReception.create({ data: payload });
  }

  // 5. Crear "3d" (padre) por combo único cliente+equipo+servicio
  console.log('Creando órdenes 3D (padre)...');
  const comboKey = (cl, eq, sv) => [cl || '', eq || '', sv || ''].join('|');
  const existingParents = await prisma.serviceOrder3D.findMany({ select: { id: true, code: true, clienteId: true, equipoId: true, servicioId: true } });
  const parentByCombo = {};
  let nextNum = 0;
  for (const p of existingParents) {
    parentByCombo[comboKey(p.clienteId, p.equipoId, p.servicioId)] = p;
    const m = (p.code || '').match(/^3D-(\d+)$/);
    if (m) nextNum = Math.max(nextNum, parseInt(m[1]));
  }

  let createdParents = 0;
  const parentIdByCombo = {};
  for (const o of data.orders) {
    const clientCode = s(o['CI_RUC']);
    const equipCode = s(o['Equipo']);
    const servCode = s(o['Servicio']);
    if (!clientCode) continue;
    const client = await prisma.helpdeskClient.findFirst({ where: { code: clientCode } });
    const equip = equipCode ? await prisma.helpdeskEquipment.findFirst({ where: { code: equipCode } }) : null;
    const serv = servCode ? await prisma.helpdeskService.findFirst({ where: { code: servCode } }) : null;
    const key = comboKey(client ? client.id : '', equip ? equip.id : '', serv ? serv.id : '');
    if (parentIdByCombo[key]) continue;
    let parent = parentByCombo[key];
    if (!parent) {
      nextNum += 1;
      const code = '3D-' + String(nextNum).padStart(4, '0');
      parent = await prisma.serviceOrder3D.create({
        data: {
          code, fecha: toDate(o['Fecha']),
          clienteId: client ? client.id : null, equipoId: equip ? equip.id : null,
          servicioId: serv ? serv.id : null, asesor: s(o['Nombre Asesor']), compromiso: null
        }
      });
      createdParents++;
    }
    parentByCombo[key] = parent;
    parentIdByCombo[key] = parent.id;
  }
  console.log('Padres creados: ' + createdParents);

  // 6. Órdenes de compra (hijo) - upsert por OrdenNo
  console.log('Seeding Órdenes de Compra (' + data.orders.length + ')...');
  let created = 0, updated = 0;
  for (const o of data.orders) {
    const ordenNo = s(o['OrdenNo']);
    if (!ordenNo) continue;
    const clientCode = s(o['CI_RUC']);
    const equipCode = s(o['Equipo']);
    const servCode = s(o['Servicio']);
    const client = clientCode ? await prisma.helpdeskClient.findFirst({ where: { code: clientCode } }) : null;
    const equip = equipCode ? await prisma.helpdeskEquipment.findFirst({ where: { code: equipCode } }) : null;
    const serv = servCode ? await prisma.helpdeskService.findFirst({ where: { code: servCode } }) : null;
    const key = comboKey(client ? client.id : '', equip ? equip.id : '', serv ? serv.id : '');
    const serviceOrderId = parentIdByCombo[key] || (parentByCombo[key] && parentByCombo[key].id);
    if (!serviceOrderId) { console.log('  SKIP (sin padre): ' + ordenNo); continue; }

    const payload = {
      serviceOrderId, fecha: toDate(o['Fecha']), recepcion: s(o['Recepcion']),
      observaciones: s(o['Observaciones']), precio: s(o['Precio']), abono: s(o['Abono']),
      subtotal: s(o['Subtotal']), nombreAsesor: s(o['Nombre Asesor']), firmaCliente: s(o['Firma Cliente']),
      revisadoPor: s(o['Revisado por']), generarPdf: s(o['Generar PDF']), video: s(o['Video']),
      estado: s(o['Estado']), tarea: s(o['Tarea']),
      descripcionPresupuesto: s(o['Descripción de Presupuesto']),
      presupuestoAprobado: s(o['Presupuesto Aprobado']), precioPresupuesto: s(o['Precio Presupuesto']),
      tiempoFinalizacion: dateStr(o['Tiempo de finalización de Incidencia']),
      servicioTipo: s(o['Servicio Tipo']), asesorTipo: s(o['Asesor Tipo']),
      diagnosticoRealizado: s(o['Diagnostico Realizado']), tecnico: s(o['Tecnico']),
      realizadoPor: s(o['Realizado por']), vendedoraNegocia: s(o['Vendedora que negocia']),
      servicioRealizado: s(o['Servicio realizado']), cobrado: s(o['Cobrado']), entregado: s(o['Entregado']),
      cobradoPor: s(o['Cobrado por']), entregadoPor: s(o['Entregado por']),
      observacionProduccion: s(o['Observacion de produccion']), observacionNegociacion: s(o['Observacion de Negociacion'])
    };

    const existing = await prisma.purchaseOrder.findFirst({ where: { ordenNo } });
    if (existing) { await prisma.purchaseOrder.update({ where: { id: existing.id }, data: payload }); updated++; }
    else { await prisma.purchaseOrder.create({ data: { ...payload, ordenNo } }); created++; }
  }
  console.log('OC creadas: ' + created + ', actualizadas: ' + updated);

  const c1 = await prisma.helpdeskClient.count({ where: { businessLine: '3D' } });
  const c2 = await prisma.helpdeskEquipment.count({ where: { businessLine: '3D' } });
  const c3 = await prisma.helpdeskService.count();
  const c4 = await prisma.serviceOrder3D.count();
  const c5 = await prisma.purchaseOrder.count();
  console.log('TOTALES -> clientes3D:' + c1 + ' equipos3D:' + c2 + ' servicios:' + c3 + ' so3d:' + c4 + ' oc:' + c5);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
