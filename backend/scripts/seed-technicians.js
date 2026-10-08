const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

const s = (v) => (v === '' || v === null || v === undefined) ? '' : String(v).trim();

function mapBusinessLine(line) {
  const l = s(line).toLowerCase();
  const has3d = l.includes('3d');
  const hasMed = l.includes('médica') || l.includes('medica');
  if (has3d && hasMed) return 'ALL';
  if (has3d) return '3D';
  return 'SM';
}

async function main() {
  const file = path.join(__dirname, '..', 'seed_data_sm.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const techs = data.technicians || [];

  const ensureRole = async (name) => {
    let r = await prisma.role.findUnique({ where: { name } });
    if (!r) r = await prisma.role.create({ data: { name, canViewAllChats: false, screenAccess: [] } });
    return r;
  };
  const adminRole = await ensureRole('ADMIN');
  const userRole = await ensureRole('USER');

  const salt = await bcrypt.genSalt(10);
  const defaultPass = await bcrypt.hash('horustech2026', salt);

  const techByCode = {};  // "ID tecnico" -> userId
  const techByEmail = {}; // email -> userId

  console.log('Seeding Técnicos (' + techs.length + ')...');
  for (const t of techs) {
    const code = s(t['ID tecnico']);
    if (!code) continue;
    const email = s(t['Correos']) || (code + '@horustech.local');
    const roleName = s(t['Rol']).toUpperCase();
    const role = roleName === 'ADMIN' ? adminRole : userRole;
    const name = s(t['Nombres Completos']) || (s(t['Nombres']) + ' ' + s(t['Apellidos'])).trim() || code;
    const businessLine = mapBusinessLine(t['Linea de trabajo']);

    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.user.update({ where: { id: user.id }, data: { name, roleId: role.id, businessLine } });
      const taken = await prisma.user.findFirst({ where: { username: code, NOT: { id: user.id } } });
      if (!taken && user.username !== code) await prisma.user.update({ where: { id: user.id }, data: { username: code } });
    } else {
      const taken = await prisma.user.findFirst({ where: { username: code } });
      user = await prisma.user.create({
        data: { name, username: taken ? null : code, email, passwordHash: defaultPass, roleId: role.id, businessLine, active: true }
      });
    }
    techByCode[code] = user.id;
    techByEmail[email.toLowerCase()] = user.id;
    console.log('  ' + code + ' -> ' + name + ' [' + businessLine + '] ' + role.name);
  }

  // Reasignar tickets (assignedUserId) por "ID Tecnico"
  console.log('Reasignando tickets...');
  let assignedT = 0;
  for (const t of data.tickets) {
    const tn = s(t['ID Ticket RIS']);
    const uid = techByCode[s(t['ID Tecnico'])];
    if (!tn || !uid) continue;
    const ticket = await prisma.ticket.findUnique({ where: { ticketNumber: tn } });
    if (ticket && !ticket.assignedUserId) {
      await prisma.ticket.update({ where: { id: ticket.id }, data: { assignedUserId: uid } });
      assignedT++;
    }
  }
  console.log('Tickets reasignados: ' + assignedT);

  // Reasignar reports (technicianId) por "Correo Tecnico"
  console.log('Reasignando reports...');
  let assignedR = 0;
  for (const email of Object.keys(techByEmail)) {
    const uid = techByEmail[email];
    const r = await prisma.ticketReport.updateMany({ where: { techEmail: email, technicianId: null }, data: { technicianId: uid } });
    assignedR += r.count;
  }
  console.log('Reports reasignados: ' + assignedR);

  console.log('TOTAL usuarios: ' + await prisma.user.count());
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
