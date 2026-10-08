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
function s(v) { return (v === '' || v === null || v === undefined) ? '' : String(v).trim(); }

const statusMap = { 'TT': 'Cerrado', 'E': 'Entregado', 'A': 'Abierto', 'S': 'Seguimiento' };

async function main() {
  const file = path.join(__dirname, '..', 'seed_data_sm.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));

  // 1. Mapa código -> nombre de tipo de incidencia
  const incMap = {};
  for (const it of data.incidentTypes) incMap[s(it['Id Servicio'])] = s(it['Tipo']);

  // 2. Cache clientes y equipos SM
  const clients = await prisma.helpdeskClient.findMany({ where: { businessLine: 'SM' }, select: { id: true, code: true } });
  const clientByCode = {};
  for (const c of clients) clientByCode[c.code] = c.id;
  const equips = await prisma.helpdeskEquipment.findMany({ where: { businessLine: 'SM' }, select: { code: true, name: true } });
  const equipByCode = {};
  for (const e of equips) equipByCode[e.code] = e.name;

  // 3. Tickets
  console.log('Seeding Tickets SM (' + data.tickets.length + ')...');
  let tc = 0, tu = 0;
  for (const t of data.tickets) {
    const ticketNumber = s(t['ID Ticket RIS']);
    if (!ticketNumber) continue;
    const equipCode = s(t['ID Equipo']);
    const payload = {
      ticketNumber,
      incidentType: incMap[s(t['ID Tipo Ticket'])] || s(t['ID Tipo Ticket']),
      subject: s(t['Tarea']).slice(0, 200),
      description: s(t['Tarea']),
      clientId: clientByCode[s(t['ID Cliente'])] || null,
      equipment: equipByCode[equipCode] || equipCode || null,
      priority: s(t['Prioridad']),
      reportedBy: s(t['Quien Reporta']),
      status: statusMap[s(t['Estado de ticket'])] || s(t['Estado de ticket']) || 'Abierto',
      createdAt: toDate(t['Fecha de creacion']) || new Date(),
      closedAt: toDate(t['Fecha de cierre'])
    };
    const existing = await prisma.ticket.findUnique({ where: { ticketNumber } });
    if (existing) { await prisma.ticket.update({ where: { id: existing.id }, data: payload }); tu++; }
    else { await prisma.ticket.create({ data: payload }); tc++; }
  }
  console.log('Tickets: creados ' + tc + ', actualizados ' + tu);

  // 4. Reports
  const tickets = await prisma.ticket.findMany({ select: { id: true, ticketNumber: true } });
  const ticketByNumber = {};
  for (const t of tickets) ticketByNumber[t.ticketNumber] = t.id;

  console.log('Seeding Reports SM (' + data.reports.length + ')...');
  let rc = 0;
  for (const r of data.reports) {
    const ticketId = ticketByNumber[s(r['ID Ticket'])];
    if (!ticketId) continue;
    const equipCode = s(r['ID Equipo']);
    const payload = {
      ticketId,
      task: s(r['Tarea']),
      clientId: clientByCode[s(r['ID Cliente'])] || null,
      equipment: equipByCode[equipCode] || equipCode || null,
      workDone: s(r['Trabajo realizado']),
      observation: s(r['Observacion']),
      startDate: toDate(r['Fecha de Inicio '] ?? r['Fecha de Inicio']),
      endDate: toDate(r['Fecha Fin']),
      status: statusMap[s(r['Estado de ticket'])] || s(r['Estado de ticket']),
      attentionModality: s(r['Modalidad de Atencion']),
      clientName: s(r['Institucion']) || s(r['Nombre Firma']),
      clientEmail: s(r['Correo Cliente']),
      clientSignatureUrl: s(r['Firma']),
      emailStatus: s(r['Estado Correo']),
      pdfUrl: s(r['PDF']),
      ccEmail: s(r['CorreoCC']),
      techEmail: s(r['Correo Tecnico'])
    };
    await prisma.ticketReport.create({ data: payload });
    rc++;
  }
  console.log('Reports creados: ' + rc);

  const totalT = await prisma.ticket.count();
  const totalR = await prisma.ticketReport.count();
  console.log('TOTALES -> tickets:' + totalT + ' reports:' + totalR);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
