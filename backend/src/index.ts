import express from 'express';
import * as xlsx from 'xlsx';

import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { PrismaClient, ConversationStatus, SenderType } from '@prisma/client';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setVapidDetails, sendNotification } from 'web-push';
import * as crypto from 'crypto';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de peticiones (logs mejorados)
app.use((req: any, res: any, next: any) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

const prisma = new PrismaClient();

const ENCRYPTION_KEY = crypto.createHash('sha256').update(process.env.JWT_SECRET || 'horus_secret').digest();
const SENSITIVE_FIELDS = ['WHATSAPP_TOKEN', 'WHATSAPP_VERIFY_TOKEN', 'NGROK_AUTHTOKEN'];

function encryptSetting(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

function decryptSetting(text: string): string {
  if (!text) return '';
  if (!text.startsWith('enc:')) return text;
  const parts = text.slice(4).split(':');
  if (parts.length !== 3) return text;
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, Buffer.from(parts[0], 'hex'));
    decipher.setAuthTag(Buffer.from(parts[1], 'hex'));
    const dec = Buffer.concat([decipher.update(Buffer.from(parts[2], 'hex')), decipher.final()]);
    return dec.toString('utf8');
  } catch (e) {
    return text;
  }
}

function encryptSensitive(obj: any): any {
  const out: any = { ...obj };
  for (const f of SENSITIVE_FIELDS) {
    if (out[f]) out[f] = encryptSetting(String(out[f]));
  }
  return out;
}

function decryptSensitive(obj: any): any {
  const out: any = { ...obj };
  for (const f of SENSITIVE_FIELDS) {
    if (out[f]) out[f] = decryptSetting(String(out[f]));
  }
  return out;
}

// Web Push (notificaciones con la pestaña cerrada)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    setVapidDetails('mailto:admin@horustech.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  } catch (e) {
    console.error('Error configurando Web Push (VAPID):', e);
  }
}

const getMetaCredentials = async () => {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { id: 'default' } });
    const data: any = setting?.data || {};
    const decrypted = decryptSensitive(data);
    return {
      whatsappToken: decrypted.WHATSAPP_TOKEN || process.env.WHATSAPP_TOKEN,
      verifyToken: decrypted.WHATSAPP_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN,
      wabaId: data.WABA_ID || '',
      phoneNumberId: data.DEFAULT_PHONE_NUMBER_ID || process.env.DEFAULT_PHONE_NUMBER_ID,
      ngrokUrl: data.NGROK_URL || process.env.NGROK_URL || '',
      ngrokAuthToken: decrypted.NGROK_AUTHTOKEN || process.env.NGROK_AUTHTOKEN || ''
    };
  } catch (e) {
    console.error('Error leyendo credenciales Meta:', e);
    return {
      whatsappToken: process.env.WHATSAPP_TOKEN || '',
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
      wabaId: '',
      phoneNumberId: process.env.DEFAULT_PHONE_NUMBER_ID || '',
      ngrokUrl: process.env.NGROK_URL || '',
      ngrokAuthToken: process.env.NGROK_AUTHTOKEN || ''
    };
  }
};


// --- Auth Middleware ---
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- Configuración de credenciales Meta (Tokens) ---
app.get('/api/meta-settings', authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'SUPERADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'No tienes permisos' });
    }
    const setting = await prisma.systemSetting.findUnique({ where: { id: 'default' } });
    const data: any = setting?.data || {};
    const decrypted = decryptSensitive(data);
    res.json({
      WHATSAPP_TOKEN: decrypted.WHATSAPP_TOKEN || '',
      WHATSAPP_VERIFY_TOKEN: decrypted.WHATSAPP_VERIFY_TOKEN || '',
      WABA_ID: data.WABA_ID || '',
      DEFAULT_PHONE_NUMBER_ID: data.DEFAULT_PHONE_NUMBER_ID || '',
      NGROK_URL: data.NGROK_URL || '',
      NGROK_AUTHTOKEN: decrypted.NGROK_AUTHTOKEN || ''
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching meta settings' });
  }
});

app.put('/api/meta-settings', authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'SUPERADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'No tienes permisos' });
    }
    const setting = await prisma.systemSetting.findUnique({ where: { id: 'default' } });
    const current: any = setting?.data || {};
    const next = encryptSensitive({ ...current, ...req.body });
    await prisma.systemSetting.upsert({
      where: { id: 'default' },
      update: { data: next },
      create: { id: 'default', data: next }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error saving meta settings' });
  }
});

// --- WEB PUSH (Service Worker) ---
app.get('/api/push/vapid-public-key', authenticateToken, (req: any, res: any) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

app.post('/api/push/subscribe', authenticateToken, async (req: any, res: any) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'Datos de suscripción inválidos' });
    }
    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId: req.user.id, p256dh: keys.p256dh, auth: keys.auth },
      create: { endpoint, userId: req.user.id, p256dh: keys.p256dh, auth: keys.auth }
    });
    res.json({ success: true, id: sub.id });
  } catch (e) {
    res.status(500).json({ error: 'Error guardando suscripción' });
  }
});

app.post('/api/push/unsubscribe', authenticateToken, async (req: any, res: any) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: req.user.id } });
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Error eliminando suscripción' });
  }
});

// --- Admin / User Management Routes ---

// Listar todos los usuarios (Solo SUPERADMIN o ADMIN)
app.get('/api/users', authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'SUPERADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'No tienes permisos para ver usuarios' });
    }
    const users = await prisma.user.findMany({
      select: { id: true, username: true, name: true, email: true, role: true, active: true, createdAt: true, lines: true, signatureUrl: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
});

// Crear nuevo usuario
app.post('/api/users', authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'SUPERADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'No tienes permisos para crear usuarios' });
    }
    const { name, username, email, password, role, lineIds, signatureUrl } = req.body;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // `role` llega como ID del rol (o vacío si no se asigna). El esquema usa la relación `roleId`.
    const roleId = role && String(role).trim() !== '' ? role : null;

    const newUser = await prisma.user.create({
      data: {
        name,
        username,
        email,
        passwordHash,
        roleId,
        lines: {
          connect: lineIds ? lineIds.map((id: string) => ({ id })) : []
        }
      }
    });

    res.json({ success: true, user: { id: newUser.id, name: newUser.name, username: newUser.username } });
  } catch (error: any) {
    res.status(500).json({ error: 'Error creando usuario. Verifica que el correo o usuario no existan ya.' });
  }
});

// Listar l�neas de WhatsApp
app.get('/api/lines', authenticateToken, async (req: any, res: any) => {
  try {
    const lines = await prisma.whatsAppLine.findMany();
    res.json(lines);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo l�neas' });
  }
});

// Crear nueva l�nea / canal de WhatsApp
app.post('/api/lines', authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'SUPERADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'No tienes permisos' });
    }
    const { name, phoneNumberId, wabaId, token } = req.body;
    const newLine = await prisma.whatsAppLine.create({
      data: { name, phoneNumberId, wabaId: wabaId || null, token: token || null, active: true }
    });
    res.json({ success: true, line: newLine });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al registrar el canal. Aseg�rate de que el ID no exista ya.' });
  }
});

// Eliminar l�nea
app.delete('/api/lines/:id', authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'SUPERADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'No tienes permisos' });
    }
    await prisma.whatsAppLine.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al eliminar el canal' });
  }
});

// Editar línea (solo token, wabaId y active; nombre y phoneNumberId son fijos)
app.put('/api/lines/:id', authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'SUPERADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'No tienes permisos' });
    }
    const { token, wabaId, active, phoneNumberId } = req.body;
    const data: any = {};
    if (token !== undefined) data.token = token || null;
    if (wabaId !== undefined) data.wabaId = wabaId || null;
    if (active !== undefined) data.active = !!active;
    if (phoneNumberId !== undefined && String(phoneNumberId).trim() !== '') data.phoneNumberId = String(phoneNumberId).trim();

    const line = await prisma.whatsAppLine.update({
      where: { id: req.params.id },
      data
    });
    res.json({ success: true, line });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al actualizar el canal' });
  }
});
// Actualizar Usuario (Editar)
app.put('/api/users/:id', authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'SUPERADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'No tienes permisos' });
    }
    const { name, username, email, password, role, lineIds, signatureUrl } = req.body;
    
    let updateData: any = {
      name,
      username,
      email,
      lines: {
        set: lineIds ? lineIds.map((id: string) => ({ id })) : []
      }
    };

    // `role` llega como ID del rol. Solo se actualiza si viene en el body.
    if (role !== undefined) {
      updateData.roleId = role && String(role).trim() !== '' ? role : null;
    }

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({ success: true, user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});
app.put('/api/users/me/password', authenticateToken, async (req: any, res: any) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(400).json({ error: 'Contraseña actual incorrecta' });

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: newHash }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
});
// --- Auth Routes ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      },
      include: { lines: true, role: true }
    });
    
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Credenciales inválidas o usuario inactivo' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, role: (user as any).role?.name || 'SALES', roleData: (user as any).role, email: user.email, businessLine: (user as any).businessLine || 'SM' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: (user as any).role?.name || 'SALES', roleData: (user as any).role,
        lines: user.lines
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error en el login' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { lines: true, role: true } });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user profile' });
  }
});

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
    'video/mp4', 'video/webm',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de archivo no permitido. Solo imagenes, audios, videos y documentos.'));
  }
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } });

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/media', express.static(uploadDir));

// Seguimiento de conexiones por usuario (para evitar notificaciones duplicadas)
const connectedUsers = new Map<string, Set<string>>();

io.use((socket: any, next: any) => {
  const token = socket.handshake?.auth?.token;
  if (!token) return next();
  try {
    const user: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    socket.data.userId = user.id;
  } catch (e) {}
  next();
});

io.on('connection', (socket: any) => {
  const userId = socket.data?.userId;
  if (userId) {
    if (!connectedUsers.has(userId)) connectedUsers.set(userId, new Set());
    connectedUsers.get(userId)!.add(socket.id);
  }
  console.log('Frontend conectado:', socket.id, userId ? `(user ${userId})` : '');
  socket.on('disconnect', () => {
    if (userId) {
      const set = connectedUsers.get(userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) connectedUsers.delete(userId);
      }
    }
  });
});

const isUserConnected = (userId: string) => {
  const set = connectedUsers.get(userId);
  return !!set && set.size > 0;
};

const sendPushToUser = async (userId: string, payload: any) => {
  try {
    if (isUserConnected(userId)) return;
    let subs: any[] = [];
    try {
      subs = await prisma.pushSubscription.findMany({ where: { userId } });
    } catch (e) {
      return; // Tabla de suscripciones aún no disponible; no bloquear el flujo
    }
    for (const sub of subs) {
      try {
        await sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (e: any) {
        if (e?.statusCode === 404 || e?.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }
  } catch (e) {
    console.error('Error enviando push:', e);
  }
};

const getConversationTargetUserIds = async (conversationId: string) => {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) return [];
  const admins = await prisma.user.findMany({
    where: { OR: [{ role: { name: 'SUPERADMIN' } }, { role: { name: 'ADMIN' } }] }
  });
  const ids = new Set(admins.map((u: any) => u.id));
  if (conversation.assignedUserId) {
    ids.add(conversation.assignedUserId);
  } else if (conversation.whatsappLineId) {
    const lineUsers = await prisma.user.findMany({
      where: { lines: { some: { id: conversation.whatsappLineId } } }
    });
    lineUsers.forEach((u: any) => ids.add(u.id));
  }
  return [...ids];
};

// Obtener un usuario del sistema (primer admin) para comentarios internos automáticos
const getSystemUserId = async () => {
  const admin = await prisma.user.findFirst({
    where: { OR: [{ role: { name: 'SUPERADMIN' } }, { role: { name: 'ADMIN' } }] }
  });
  return admin?.id || null;
};

// Crear un comentario interno automático en una conversación
const createAutoComment = async (conversationId: string, content: string) => {
  try {
    const authorId = await getSystemUserId();
    if (!authorId) return;
    const comment = await prisma.internalComment.create({
      data: { conversationId, authorId, content, mentions: [] },
      include: { author: true }
    });
    io.emit('new_message', { ...comment, isInternal: true, senderType: 'INTERNAL', senderName: comment.author?.name, conversationId });
  } catch (e) {
    console.error('Error creando comentario automático:', e);
  }
};

// --- FASE 2: ENDPOINTS PARA LA INTERFAZ DEL CRM ---



// --- ENVIAR PLANTILLA (WhatsApp Template) ---
app.post('/api/conversations/:id/template', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { templateName, languageCode = 'es' } = req.body;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { contact: true, whatsappLine: true }
    });

    if (!conversation) return res.status(404).json({ error: 'Conversacin no encontrada' });

    // Payload para Meta
    // Armar el payload con o sin variables
    const components = [];
    if (req.body.variables && req.body.variables.length > 0) {
      components.push({
        type: 'body',
        parameters: req.body.variables.map((val: string) => ({
          type: 'text',
          text: val
        }))
      });
    }

    const metaPayload: any = {
      messaging_product: 'whatsapp',
      to: conversation.contact.phone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode }
      }
    };

    if (components.length > 0) {
      metaPayload.template.components = components;
    }

    // Llamada a WhatsApp API
    const creds = await getMetaCredentials();
    const token = conversation.whatsappLine?.token || creds.whatsappToken || process.env.WHATSAPP_TOKEN;
    const phoneNumberId = conversation.whatsappLine?.phoneNumberId || creds.phoneNumberId || process.env.DEFAULT_PHONE_NUMBER_ID || '';
    if (!token || !phoneNumberId) {
      return res.status(400).json({ error: 'Falta configurar Token o Phone Number ID en Configuración API' });
    }
    const metaRes = await fetch(
      `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metaPayload)
      }
    );

    const metaData = await metaRes.json();
    if (!metaRes.ok) throw new Error(metaData.error?.message || 'Error Meta');
    const metaMessageId = metaData.messages[0].id;

    // Guardar en la DB
    const newMessage = await prisma.message.create({
      data: {
        conversationId: id,
        senderType: 'AGENT',
        senderUserId: req.user.id,
        content: `[Plantilla Enviada: ${templateName}]`,
        metaMessageId
      }
    });
      await prisma.conversation.update({ where: { id: newMessage.conversationId }, data: { updatedAt: new Date() } }).catch(()=>{});

    io.emit('new_message', newMessage);
    res.json(newMessage);
  } catch (error: any) {
    console.error('Error enviando plantilla:', error.response?.data || error);
    res.status(500).json({ error: 'Error enviando plantilla', details: error.response?.data });
  }
});

app.put('/api/conversations/:id/assign', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { assignedUserId } = req.body;
    
    // Si assignedUserId es undefined, asumimos que es "asignarme a mi" por defecto (retrocompatibilidad)
    const targetUserId = assignedUserId !== undefined ? assignedUserId : req.user.id;
    
    const existing = await prisma.conversation.findUnique({ where: { id }, include: { contact: true, whatsappLine: true } });
    if (!existing) return res.status(404).json({ error: 'Conversation not found' });

    const conversation = await prisma.conversation.update({
      where: { id },
      data: { assignedUserId: targetUserId } // Puede ser un ID o null para liberar
    });
    
    // Notificación persistente para el vendedor asignado (si es otro usuario)
    if (targetUserId && targetUserId !== req.user.id) {
      await prisma.reminder.create({
        data: {
          contactId: existing.contactId,
          userId: targetUserId,
          scheduledFor: new Date(),
          notes: `🔔 Te asignaron un chat con ${existing.contact?.name || existing.contact?.phone || 'un contacto'}`,
          isCompleted: false
        }
      }).catch(() => {});
    }

    io.emit('chat_assigned', { conversationId: id, assignedUserId: targetUserId });
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Error asignando chat' });
  }
});


// --- ROLES ---
app.get('/api/roles', authenticateToken, async (req, res) => {
  try {
    const roles = await prisma.role.findMany({ include: { _count: { select: { users: true } } } });
    res.json(roles);
  } catch (e) {
    res.status(500).json({ error: 'Error fetching roles' });
  }
});

app.post('/api/roles', authenticateToken, async (req, res) => {
  try {
    const { name, canViewAllChats, screenAccess } = req.body;
    const role = await prisma.role.create({
      data: { name, canViewAllChats, screenAccess }
    });
    res.json(role);
  } catch (e) {
    res.status(500).json({ error: 'Error creating role' });
  }
});

app.put('/api/roles/:id', authenticateToken, async (req, res) => {
  try {
    const { name, canViewAllChats, screenAccess } = req.body;
    const role = await prisma.role.update({
      where: { id: req.params.id },
      data: { name, canViewAllChats, screenAccess }
    });
    res.json(role);
  } catch (e) {
    res.status(500).json({ error: 'Error updating role' });
  }
});

app.delete('/api/roles/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.role.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Error deleting role' });
  }
});


// --- PARAMETERS ---

app.get('/api/debug/parameters', async (req: any, res: any) => {
  try {
    const count = await prisma.parameter.count();
    res.json({ success: true, count });
  } catch (error: any) {
    res.json({ success: false, error: error.message, stack: error.stack });
  }
});

app.get('/api/parameters', authenticateToken, async (req: any, res: any) => {
  try {
    // Auto-seed if empty
    const count = await prisma.parameter.count();
    if (count === 0) {
      const defaults = [
        { mnemonic: 'SISTEMA_PANTALLAS', name: 'Pantallas del Sistema', description: 'Opciones de menú' },
        { mnemonic: 'CLIENTES_SM', name: 'Clientes SM', description: '' },
        { mnemonic: 'CLIENTES_3D', name: 'Clientes 3D', description: '' },
        { mnemonic: 'EQUIPOS_SM', name: 'Equipos SM', description: '' },
        { mnemonic: 'EQUIPOS_3D', name: 'Equipos 3D', description: '' },
        { mnemonic: 'INCIDENCIAS_SM', name: 'Tipos de Incidencia SM', description: '' },
        { mnemonic: 'INCIDENCIAS_3D', name: 'Tipos de Incidencia 3D', description: '' },
        { mnemonic: 'TAREAS_SM', name: 'Tipos de Tareas SM', description: '' },
        { mnemonic: 'INCIDENCIAS_3D', name: 'Tipos de Tareas 3D', description: '' },
        { mnemonic: 'PROVEEDORES_SM', name: 'Proveedores SM', description: '' },
        { mnemonic: 'PROVEEDORES_3D', name: 'Proveedores 3D', description: '' },
      ];
      for (const item of defaults) {
        await prisma.parameter.create({ data: { mnemonic: item.mnemonic, name: item.name, description: item.description, parentId: null } });
      }
    }

    const parentId = req.query.parentId;
    const mnemonic = req.query.mnemonic;
    let whereClause: any = {};
    if (parentId !== undefined) {
      whereClause.parentId = parentId === '0' || parentId === '' || parentId === 'null' ? null : parentId;
    }
    if (mnemonic) {
      whereClause.mnemonic = mnemonic;
    }
    const data = await prisma.parameter.findMany({ 
      where: whereClause,
      include: { children: true, parent: { select: { name: true } } },
      orderBy: { name: 'asc' }
    });
    res.json(data);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Error' }); }
});


app.post('/api/parameters/migrate', authenticateToken, async (req: any, res: any) => {
  try {
    // Migrate Clients SM
    const clientsSM = await prisma.helpdeskClient.findMany({ where: { businessLine: 'SM' } });
    const parentClientSM = await prisma.parameter.findUnique({ where: { mnemonic: 'CLIENTES_SM' } });
    if(parentClientSM) {
      for (const c of clientsSM) {
        const ex = await prisma.parameter.findFirst({ where: { parentId: parentClientSM.id, name: c.name } });
        if (!ex) await prisma.parameter.create({ data: { parentId: parentClientSM.id, name: c.name, value: c.id } });
      }
    }
    
    // Migrate Clients 3D
    const clients3D = await prisma.helpdeskClient.findMany({ where: { businessLine: '3D' } });
    const parentClient3D = await prisma.parameter.findUnique({ where: { mnemonic: 'CLIENTES_3D' } });
    if(parentClient3D) {
      for (const c of clients3D) {
        const ex = await prisma.parameter.findFirst({ where: { parentId: parentClient3D.id, name: c.name } });
        if (!ex) await prisma.parameter.create({ data: { parentId: parentClient3D.id, name: c.name, value: c.id } });
      }
    }

    // CLEANUP old flat equipments (if any were created under EQUIPOS_SM / 3D)
    const eqRootSM = await prisma.parameter.findUnique({ where: { mnemonic: 'EQUIPOS_SM' } });
    if (eqRootSM) await prisma.parameter.deleteMany({ where: { parentId: eqRootSM.id } });
    const eqRoot3D = await prisma.parameter.findUnique({ where: { mnemonic: 'EQUIPOS_3D' } });
    if (eqRoot3D) await prisma.parameter.deleteMany({ where: { parentId: eqRoot3D.id } });

    // Migrate Equipments SM (Nested under Clients)
    const eqSM = await prisma.helpdeskEquipment.findMany({ where: { businessLine: 'SM' } });
    if(parentClientSM) {
      for (const e of eqSM) {
        const oldClient = e.clientId ? await prisma.helpdeskClient.findUnique({ where: { id: e.clientId } }) : null;
        if (oldClient) {
          const newClient = await prisma.parameter.findFirst({ where: { parentId: parentClientSM.id, name: oldClient.name } });
          if (newClient) {
            const ex = await prisma.parameter.findFirst({ where: { parentId: newClient.id, name: e.name } });
            if (!ex) await prisma.parameter.create({ data: { parentId: newClient.id, name: e.name, description: e.brand } });
          }
        }
      }
    }

    // Migrate Equipments 3D (Nested under Clients)
    const eq3D = await prisma.helpdeskEquipment.findMany({ where: { businessLine: '3D' } });
    if(parentClient3D) {
      for (const e of eq3D) {
        const oldClient = e.clientId ? await prisma.helpdeskClient.findUnique({ where: { id: e.clientId } }) : null;
        if (oldClient) {
          const newClient = await prisma.parameter.findFirst({ where: { parentId: parentClient3D.id, name: oldClient.name } });
          if (newClient) {
            const ex = await prisma.parameter.findFirst({ where: { parentId: newClient.id, name: e.name } });
            if (!ex) await prisma.parameter.create({ data: { parentId: newClient.id, name: e.name, description: e.brand } });
          }
        }
      }
    }

    // Migrate Incidents SM
    const incSM = await prisma.helpdeskIncidentType.findMany({ where: { businessLine: 'SM' } });
    const parentIncSM = await prisma.parameter.findUnique({ where: { mnemonic: 'INCIDENCIAS_SM' } });
    if(parentIncSM) {
      for (const i of incSM) {
        const ex = await prisma.parameter.findFirst({ where: { parentId: parentIncSM.id, name: i.name } });
        if (!ex) await prisma.parameter.create({ data: { parentId: parentIncSM.id, name: i.name, value: i.id } });
      }
    }

    // Migrate Tasks SM
    const taskSM = await prisma.helpdeskTaskType.findMany({ where: { businessLine: 'SM' } });
    const parentTaskSM = await prisma.parameter.findUnique({ where: { mnemonic: 'TAREAS_SM' } });
    if(parentTaskSM) {
      for (const t of taskSM) {
        const ex = await prisma.parameter.findFirst({ where: { parentId: parentTaskSM.id, name: t.name } });
        if (!ex) await prisma.parameter.create({ data: { parentId: parentTaskSM.id, name: t.name, value: t.id } });
      }
    }
    res.json({ success: true });
  } catch(e) { console.error(e); res.status(500).json({ error: 'Error' }) }
});

app.post('/api/parameters', authenticateToken, async (req: any, res: any) => {
  try {
    let { parentId, mnemonic, name, value, description, numericValue, status, metadata } = req.body;
    if (parentId === '0' || parentId === '') parentId = null;
    const data = await prisma.parameter.create({ 
      data: { parentId, mnemonic, name, value, description, numericValue: numericValue ? parseFloat(numericValue) : null, status: status || 'A', metadata: metadata || undefined }
    });
    res.json(data);
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});

app.put('/api/parameters/:id', authenticateToken, async (req: any, res: any) => {
  try {
    let { parentId, mnemonic, name, value, description, numericValue, status, metadata } = req.body;
    if (parentId === '0' || parentId === '') parentId = null;
    const data = await prisma.parameter.update({ 
      where: { id: req.params.id },
      data: { parentId, mnemonic, name, value, description, numericValue: numericValue ? parseFloat(numericValue) : null, status: status || 'A', metadata: metadata || undefined }
    });
    res.json(data);
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});

app.delete('/api/parameters/:id', authenticateToken, async (req: any, res: any) => {
  try {
    await prisma.parameter.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});

// --- Conversation Routes ---

app.get('/api/users/agents', authenticateToken, async (req: any, res: any) => {
  try {
    const agents = await prisma.user.findMany({
      select: { id: true, name: true, username: true }
    });
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching agents' });
  }
});


app.post('/api/upload', authenticateToken, (req: any, res: any) => {
  upload.single('file')(req, res, function (err) {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/media/' + req.file.filename;
    res.json({ url });
  });
});


// Actualizar colaboradores manualmente
app.put('/api/conversations/:id/collaborators', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { collaboratorIds } = req.body;
    
    const conversation = await prisma.conversation.update({
      where: { id },
      data: {
        collaborators: {
          set: collaboratorIds.map((cId: string) => ({ id: cId }))
        }
      },
      include: { collaborators: true }
    });
    
    io.emit('chat_collaborators_updated', { conversationId: id, collaborators: conversation.collaborators });
    res.json(conversation);
  } catch (err) {
    console.error('Error updating collaborators', err);
    res.status(500).json({ error: 'Error updating collaborators' });
  }
});

app.get('/api/conversations', authenticateToken, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { lines: true, role: true } });
    
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const lineIds = user.lines.map((l: any) => l.id);

    // Regla de visibilidad:
    // 1. Si está asignado a mí, lo veo (assignedUserId == myId)
    // 2. Si NO está asignado a nadie, y pertenece a una de MIS líneas, lo veo.
    // 3. Si NO está asignado a nadie, y es un chat legacy (whatsappLineId nulo), lo veo temporalmente para no perder historial.
    
      const isAdmin = ((user as any).role?.name || (user as any).role) === 'SUPERADMIN' || ((user as any).role?.name || (user as any).role) === 'ADMIN';
      const whereClause = isAdmin ? {} : {
        OR: [
          { assignedUserId: user.id },
          { collaborators: { some: { id: user.id } } },
          { 
            assignedUserId: null, 
            whatsappLineId: { in: lineIds }
          },
          {
            assignedUserId: null,
            whatsappLineId: null
          }
        ]
      };


    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      include: {
        collaborators: true,
        contact: true,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: {
          select: { messages: { where: { senderType: 'CLIENT', status: 'RECEIVED' } } }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching conversations' });
  }
});

app.put('/api/conversations/:id/read', authenticateToken, async (req, res) => {
  try {
    await prisma.message.updateMany({
      where: { 
        conversationId: req.params.id, 
        senderType: 'CLIENT',
        status: 'RECEIVED'
      },
      data: { status: 'READ' }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error marking read' });
  }
});

app.get('/api/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: { conversationId: req.params.id },
    });
    const comments = await prisma.internalComment.findMany({
      where: { conversationId: req.params.id },
      include: { author: true }
    });

    const unified = [
      ...messages.map(m => ({ ...m, isInternal: false })),
      ...comments.map(c => ({ 
        ...c, 
        isInternal: true, 
        senderType: 'INTERNAL', 
        senderName: c.author?.name 
      }))
    ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    res.json(unified);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching messages' });
  }
});

// Post Internal Comment

// Update Conversation Stage
app.put('/api/conversations/:id/stage', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;
    const conversation = await prisma.conversation.update({
      where: { id },
      data: { stage }
    });
    res.json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating stage' });
  }
});

app.post('/api/conversations/:id/comments', authenticateToken, async (req: any, res: any) => {
  try {
    const { content, mentions } = req.body;
    const comment = await prisma.internalComment.create({
      data: {
        conversationId: req.params.id,
        authorId: req.user.id,
        content,
        mentions: mentions || []
      },
      include: { author: true }
    });
    

    // NOTIFICACIONES POR MENCIONES
    const allUsers = await prisma.user.findMany();
    for (const u of allUsers) {
      if (content.includes('@' + u.name)) {
        const conversation = await prisma.conversation.findUnique({ where: { id: req.params.id }});
        if (conversation && conversation.contactId) {
          await prisma.reminder.create({
            data: {
              contactId: conversation.contactId,
              userId: u.id,
              scheduledFor: new Date(),
              notes: `@${comment.author?.name || 'Alguien'} te mencionó: "${content.substring(0, 30)}..."`,
              isCompleted: false
            }
          });
        }
      }
    }

    const formatted = {
      ...comment,
      isInternal: true,
      senderType: 'INTERNAL',
      senderName: comment.author?.name
    };
    
    io.emit('new_message', { ...formatted, conversationId: req.params.id, isInternal: true });
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Error creating comment' });
  }
});

app.post('/api/conversations/:id/messages', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { content, mediaUrl, mediaType } = req.body;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        collaborators: true,
        contact: true, whatsappLine: true }
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const savedMessage = await prisma.message.create({
      data: {
        conversationId: id,
        senderType: 'AGENT',
        content,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || 'TEXT'
      }
    });
      await prisma.conversation.update({ where: { id: savedMessage.conversationId }, data: { updatedAt: new Date() } }).catch(()=>{});

    io.emit('new_message', { ...savedMessage, contactName: (conversation as any).contact?.name || (undefined), phoneNumber: (conversation as any).contact?.phone || (undefined), conversationContext: conversation });

    const creds = await getMetaCredentials();
      const token = (conversation as any).whatsappLine?.token || creds.whatsappToken || process.env.WHATSAPP_TOKEN;
      let phoneNumberId = (conversation as any).whatsappLine?.phoneNumberId || creds.phoneNumberId || process.env.DEFAULT_PHONE_NUMBER_ID || '';

    if (token && token !== 'tu_token_de_acceso' && phoneNumberId) {
      try {
        let metaMediaId = null;
        
        if (mediaUrl) {
          try {
            const filename = mediaUrl.split('/').pop();
            const localFilePath = require('path').join(__dirname, '../uploads', filename);
            
            if (require('fs').existsSync(localFilePath)) {
              console.log('Subiendo archivo a Meta:', localFilePath);
              const formData = new FormData();
              formData.append('messaging_product', 'whatsapp');
              
              let mimeType = 'application/octet-stream';
              if (mediaType === 'IMAGE') mimeType = 'image/jpeg';
              if (mediaType === 'AUDIO') mimeType = 'audio/mp4';
              if (mediaType === 'VIDEO') mimeType = 'video/mp4';
              if (mediaType === 'DOCUMENT_PDF') mimeType = 'application/pdf';
              
              const fileBuffer = require('fs').readFileSync(localFilePath);
              const blob = new Blob([fileBuffer], { type: mimeType });
              formData.append('file', blob, filename);

              const uploadRes = await fetch("https://graph.facebook.com/v19.0/" + phoneNumberId + "/media", {
                method: 'POST',
                headers: {
                  'Authorization': "Bearer " + token
                },
                body: formData
              });
              
              const uploadData = await uploadRes.json();
              console.log('Respuesta Meta Upload:', uploadData);
              if (uploadData.id) {
                metaMediaId = uploadData.id;
              }
            }
          } catch (err) {
            console.error('Error subiendo media a Meta:', err);
          }
        }

        const payload = metaMediaId ? {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: conversation.contact.phone,
          type: mediaType === 'IMAGE' ? 'image' : mediaType === 'AUDIO' ? 'audio' : mediaType === 'VIDEO' ? 'video' : 'document',
          [mediaType === 'IMAGE' ? 'image' : mediaType === 'AUDIO' ? 'audio' : mediaType === 'VIDEO' ? 'video' : 'document']: { id: metaMediaId, caption: content }
        } : mediaUrl ? {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: conversation.contact.phone,
          type: mediaType === 'IMAGE' ? 'image' : mediaType === 'AUDIO' ? 'audio' : mediaType === 'VIDEO' ? 'video' : 'document',
          [mediaType === 'IMAGE' ? 'image' : mediaType === 'AUDIO' ? 'audio' : mediaType === 'VIDEO' ? 'video' : 'document']: { link: mediaUrl, caption: content }
        } : {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: conversation.contact.phone,
          type: "text",
          text: { preview_url: false, body: content }
        };

        const metaRes = await fetch("https://graph.facebook.com/v19.0/" + phoneNumberId + "/messages", {
          method: 'POST',
          headers: {
            'Authorization': "Bearer " + token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        const metaData = await metaRes.json();
        console.log('Respuesta de Meta:', metaData);
          if (metaData.error) {
             return res.status(400).json({ error: 'Meta Error: ' + metaData.error.message });
          }
          if (metaData.messages && metaData.messages[0]) {
             await prisma.message.update({
               where: { id: savedMessage.id },
               data: { metaMessageId: metaData.messages[0].id, status: 'SENT' }
             });
             io.emit('message_status_update', { id: savedMessage.id, metaMessageId: metaData.messages[0].id, status: 'SENT', conversationId: savedMessage.conversationId });
          }

      } catch (err) {
        console.error('Error al enviar a Meta:', err);
      }
    }

    res.json(savedMessage);
  } catch (error) {
    console.error('Error en envío de mensaje:', error);
    res.status(500).json({ error: 'Error sending message' });
  }
});




// --- GESTION DE PLANTILLAS META ---
app.get('/api/templates', authenticateToken, async (req: any, res: any) => {
  try {
    const templates = await prisma.metaTemplate.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching templates' });
  }
});


app.get('/api/templates/sync', authenticateToken, async (req: any, res: any) => {
  try {
    const creds = await getMetaCredentials();
    const globalToken = creds.whatsappToken || process.env.WHATSAPP_TOKEN;
    const globalWaba = creds.wabaId || '';
    if (!globalToken) return res.status(400).json({ error: 'Falta configurar el Token de acceso' });

    // Consultar la BD: obtener todos los canales (números)
    const lines = await prisma.whatsAppLine.findMany();
    const wabaTokens = new Map<string, string>();
    for (const l of lines) {
      const effectiveWaba = l.wabaId || globalWaba;
      if (!effectiveWaba) continue;
      if (!wabaTokens.has(effectiveWaba)) {
        wabaTokens.set(effectiveWaba, l.token || globalToken);
      }
    }
    // Si no hay líneas, usar el global
    if (wabaTokens.size === 0 && globalWaba) wabaTokens.set(globalWaba, globalToken);
    if (wabaTokens.size === 0) return res.status(400).json({ error: 'Falta configurar WABA ID' });

    let totalCount = 0;
    for (const [wabaId, wabaToken] of wabaTokens.entries()) {
      const metaRes = await fetch(`https://graph.facebook.com/v17.0/${wabaId}/message_templates`, {
        headers: { 'Authorization': `Bearer ${wabaToken}` }
      });
      const data = await metaRes.json();
      if (!metaRes.ok) continue; // si una cuenta falla, continuar con las demás
      const metaTemplates = data.data || [];

      // Actualizar estados localmente
      for (const mt of metaTemplates) {
        await prisma.metaTemplate.updateMany({
          where: { name: mt.name, language: mt.language },
          data: { status: mt.status } // 'APPROVED', 'REJECTED', 'PENDING'
        });
      }
      totalCount += metaTemplates.length;
    }

    res.json({ success: true, count: totalCount, wabaIds: [...wabaTokens.keys()] });
  } catch (error: any) {
    res.status(500).json({ error: 'Error sync', details: error.message });
  }
});


app.put('/api/templates/:id', authenticateToken, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { name, category, language, bodyText, variables, examples, submitToMeta } = req.body;
      let status = 'LOCAL';

      const existing = await prisma.metaTemplate.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Not found' });

      if (submitToMeta) {
        const creds = await getMetaCredentials();
        const wabaId = creds.wabaId;
        const token = creds.whatsappToken;
        if (!wabaId || !token) return res.status(400).json({ error: 'Falta WABA ID o Token' });

        const varNames = JSON.parse(variables || '[]');
        const exampleValues = examples ? JSON.parse(examples) : [];
        const componentPayload: any = { type: 'BODY', text: bodyText };
        if (varNames.length > 0) {
          componentPayload.example = {
            body_text: [exampleValues.length === varNames.length ? exampleValues : varNames.map((_: any, i: number) => i === 0 ? 'Juan' : 'Impresora 3D')]
          };
        }

        let url = `https://graph.facebook.com/v17.0/${wabaId}/message_templates`;
        let payload: any = { name, category, components: [componentPayload], language };

        if (existing.metaId) {
          url = `https://graph.facebook.com/v17.0/${existing.metaId}`;
          payload = { components: [componentPayload] };
        }

        const metaRes = await fetch(url, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await metaRes.json();
        if (!metaRes.ok) return res.status(400).json({ error: 'Error de Meta', details: data });
        status = 'PENDING';
      }

      const template = await prisma.metaTemplate.update({
        where: { id },
        data: { name, category, language, bodyText, variables, status }
      });
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ error: 'Error updating template', details: error.message });
    }
  });

app.delete('/api/templates/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const template = await prisma.metaTemplate.findUnique({ where: { id } });
    if (!template) return res.status(404).json({ error: 'Not found' });

    // Intentar borrar de Meta
    const creds = await getMetaCredentials();
    if (creds.wabaId && creds.whatsappToken) {
      await fetch(`https://graph.facebook.com/v17.0/${creds.wabaId}/message_templates?name=${template.name}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${creds.whatsappToken}` }
      });
    }

    await prisma.metaTemplate.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Error deleting template' });
  }
});

app.post('/api/templates', authenticateToken, async (req: any, res: any) => {
  try {
    const { name, category, language, bodyText, variables, examples, submitToMeta } = req.body;
    
    let metaId = null;
    let status = 'LOCAL';

    // Si el usuario quiere mandarla a Facebook para aprobacion
    if (submitToMeta) {
      const creds = await getMetaCredentials();
      const wabaId = creds.wabaId;
      const token = creds.whatsappToken;
      
      if (!wabaId || !token) {
        return res.status(400).json({ error: 'Falta configurar WABA ID o Token en Configuración API' });
      }
      // Reemplazamos {{variable}} por {{1}}, {{2}} para el formato de Meta
      let metaBodyText = bodyText;
      const varNames = JSON.parse(variables || '[]');
      varNames.forEach((v: string, i: number) => {
        metaBodyText = metaBodyText.replace(`{{${v}}}`, `{{${i + 1}}}`);
      });

      const payload = {
        name,
        category,
        components: [{ type: 'BODY', text: metaBodyText }],
        language
      };

      const metaRes = await fetch(`https://graph.facebook.com/v17.0/${wabaId}/message_templates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await metaRes.json();
      if (!metaRes.ok) {
        return res.status(400).json({ error: 'Error de Meta', details: data });
      }
      metaId = data.id;
      status = 'PENDING';
    }

    const template = await prisma.metaTemplate.create({
      data: { name, category, language, bodyText, variables, status, metaId }
    });
    res.json(template);
  } catch (error: any) {
    res.status(500).json({ error: 'Error creating template', details: error.message });
  }
});

// --- FASE 1 & MULTI-NUMBER: ENDPOINTS DEL WEBHOOK DE META ---

app.get('/webhook/whatsapp', async (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const creds = await getMetaCredentials();
    const verifyToken = creds.verifyToken || process.env.WHATSAPP_VERIFY_TOKEN;
    if (mode === 'subscribe' && verifyToken && token === verifyToken) {
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  } catch (error) {
    console.error('Error en verificación de webhook:', error);
    return res.sendStatus(500);
  }
});

app.post('/webhook/whatsapp', async (req, res) => {
  try {
    const body = req.body;
    const metaCreds = await getMetaCredentials();
    const metaToken = metaCreds.whatsappToken || process.env.WHATSAPP_TOKEN;
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value && change.value.statuses) {
            for (const statusObj of change.value.statuses) {
              const messageId = statusObj.id;
              const status = statusObj.status; // 'sent', 'delivered', 'read', 'failed'
              if (messageId) {
                const existingMessage = await prisma.message.findUnique({ where: { metaMessageId: messageId } });
                if (existingMessage) {
                  await prisma.message.update({
                    where: { metaMessageId: messageId },
                    data: { status: status.toUpperCase() }
                  });
                  io.emit('message_status_update', { id: existingMessage.id, metaMessageId: messageId, status: status.toUpperCase(), conversationId: existingMessage.conversationId });
                }
              }
            }
          }
          
          if (change.value && change.value.messages) {
            
            // 1. Identificar la Linea receptora
            const metadata = change.value.metadata;
            const phoneNumberId = metadata?.phone_number_id || '';
            
            let whatsappLine = null;
            if (phoneNumberId) {
              whatsappLine = await prisma.whatsAppLine.findUnique({
                where: { phoneNumberId }
              });
            }

            const messageObj = change.value.messages[0];
            const contactObj = change.value.contacts && change.value.contacts.length > 0 ? change.value.contacts[0] : null;
            
            const phone = contactObj ? contactObj.wa_id : messageObj.from;
            const name = contactObj && contactObj.profile ? contactObj.profile.name : "Desconocido";
            
            let text = messageObj.text?.body || '';
            let mediaUrl = null;
            let mediaType: import('@prisma/client').MediaType = 'TEXT';
            let mediaIdToDownload = null;

            if (messageObj.type === 'image') {
              mediaType = 'IMAGE';
              text = messageObj.image?.caption || '';
              mediaIdToDownload = messageObj.image?.id;
            } else if (messageObj.type === 'audio') {
              mediaType = 'AUDIO';
              text = '[Audio recibido]';
              mediaIdToDownload = messageObj.audio?.id;
            } else if (messageObj.type === 'video') {
              mediaType = 'VIDEO';
              text = messageObj.video?.caption || '';
              mediaIdToDownload = messageObj.video?.id;
            } else if (messageObj.type === 'document') {
              mediaType = 'DOCUMENT_PDF';
              text = messageObj.document?.filename || '[Documento recibido]';
              mediaIdToDownload = messageObj.document?.id;
            } else if (!text) {
              text = '[Mensaje no soportado]';
            }

            if (mediaIdToDownload && metaToken) {
              try {
                // 1. Obtener la URL del media
                const mediaMetaRes = await fetch("https://graph.facebook.com/v19.0/" + mediaIdToDownload, {
                  headers: { 'Authorization': "Bearer " + metaToken }
                });
                const mediaMeta = await mediaMetaRes.json();
                
                if (mediaMeta.url) {
                  // 2. Descargar el archivo binario
                  const fileRes = await fetch(mediaMeta.url, {
                    headers: { 'Authorization': "Bearer " + metaToken }
                  });
                  const arrayBuf = await fileRes.arrayBuffer();
                  const buffer = Buffer.from(arrayBuf);
                  
                  const mime = mediaMeta.mime_type || 'application/octet-stream';
                  let ext = '.bin';
                  if (mime.includes('jpeg')) ext = '.jpg';
                  else if (mime.includes('png')) ext = '.png';
                  else if (mime.includes('webp')) ext = '.webp';
                  else if (mime.includes('ogg')) ext = '.ogg';
                  else if (mime.includes('mp4')) ext = '.mp4';
                  else if (mime.includes('pdf')) ext = '.pdf';
                  else if (mime.includes('word')) ext = '.docx';

                  const filename = Date.now() + '-' + mediaIdToDownload + ext;
                  const savePath = require('path').join(__dirname, '../uploads', filename);
                  
                  // Asegurar que la carpeta existe
                  if (!require('fs').existsSync(require('path').join(__dirname, '../uploads'))) {
                    require('fs').mkdirSync(require('path').join(__dirname, '../uploads'), { recursive: true });
                  }

                  require('fs').writeFileSync(savePath, buffer);
                  
                  mediaUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/media/' + filename;
                }
              } catch (e) {
                console.error('Error descargando media de Meta:', e);
              }
            }

            const messageId = messageObj.id;

            const existingMessage = await prisma.message.findUnique({
              where: { metaMessageId: messageId }
            });
            if (existingMessage) continue;

            let contact = await prisma.contact.findUnique({ where: { phone } });
            if (!contact) {
              contact = await prisma.contact.create({ data: { phone, name } });
            }

            let conversation = await prisma.conversation.findFirst({
              where: { 
                contactId: contact.id,
                whatsappLineId: whatsappLine ? whatsappLine.id : null
              },
              orderBy: { createdAt: 'desc' }
            });

            if (!conversation) {
              conversation = await prisma.conversation.create({
                data: {
                  contactId: contact.id,
                  channel: whatsappLine ? whatsappLine.name : 'whatsapp',
                  whatsappLineId: whatsappLine ? whatsappLine.id : null,
                  status: 'OPEN',
                  stage: 'NUEVO_LEAD'
                }
              });
            } else if (whatsappLine && conversation.whatsappLineId !== whatsappLine.id) {
               await prisma.conversation.update({
                 where: { id: conversation.id },
                 data: { 
                   whatsappLineId: whatsappLine.id,
                   channel: whatsappLine.name 
                 }
               });
            }

            const isEcho = messageObj.from !== phone;

            // Regla de 90 días (cartera): solo para mensajes entrantes de cliente
            if (!isEcho) {
              const now = new Date();
              const prevIncoming = contact.lastIncomingAt ? new Date(contact.lastIncomingAt) : null;
              const daysSince = prevIncoming ? (now.getTime() - prevIncoming.getTime()) / (24 * 60 * 60 * 1000) : null;
              const isActivePortfolio = !!prevIncoming && daysSince !== null && daysSince <= 90;

              // Actualizar la fecha de última interacción del contacto
              await prisma.contact.update({ where: { id: contact.id }, data: { lastIncomingAt: now } }).catch(() => {});
              contact.lastIncomingAt = now;

              if (isActivePortfolio && contact.assignedUserId) {
                // Cartera activa (≤ 90 días): asignar la conversación a su vendedor
                const assignedUser = await prisma.user.findUnique({ where: { id: contact.assignedUserId } });
                if (assignedUser && assignedUser.active && conversation.assignedUserId !== contact.assignedUserId) {
                  conversation = await prisma.conversation.update({
                    where: { id: conversation.id },
                    data: { assignedUserId: contact.assignedUserId }
                  });
                  io.emit('chat_assigned', { conversationId: conversation.id, assignedUserId: contact.assignedUserId });
                }
              } else if (prevIncoming && !isActivePortfolio && contact.assignedUserId) {
                // Cartera expirada (> 90 días): quitar el vendedor y volver el chat al pool
                await prisma.contact.update({ where: { id: contact.id }, data: { assignedUserId: null } }).catch(() => {});
                contact.assignedUserId = null;
                if (conversation.assignedUserId) {
                  conversation = await prisma.conversation.update({
                    where: { id: conversation.id },
                    data: { assignedUserId: null }
                  });
                  io.emit('chat_assigned', { conversationId: conversation.id, assignedUserId: null });
                }
                await createAutoComment(conversation.id, '🔄 Lead liberado al pool (cartera expirada > 90 días)');
              } else if (!prevIncoming && !contact.assignedUserId && !conversation.assignedUserId) {
                // Lead nuevo sin vendedor: avisar al equipo
                await createAutoComment(conversation.id, '🆕 Nuevo lead sin asignar');
              }
            }

            const savedMessage = await prisma.message.create({
                data: {
                  conversationId: conversation.id,
                  senderType: isEcho ? 'AGENT' : 'CLIENT',
                  content: text,
                  mediaType: mediaType,
                  mediaUrl: mediaUrl,
                  metaMessageId: messageId,
                  status: isEcho ? 'SENT' : 'RECEIVED'
                }
              });
      await prisma.conversation.update({ where: { id: savedMessage.conversationId }, data: { updatedAt: new Date() } }).catch(()=>{});

            io.emit('new_message', { ...savedMessage, contactName: contact.name, phoneNumber: contact.phone, conversationContext: conversation });

            // Notificación push (Web Push) para usuarios NO conectados por socket
            if (!isEcho) {
              try {
                const targetIds = await getConversationTargetUserIds(conversation.id);
                const pushPayload = {
                  title: `Mensaje de ${contact.name || phone}`,
                  body: (text || 'Nuevo mensaje').substring(0, 120),
                  icon: '/logo-icon.png',
                  tag: conversation.id,
                  conversationId: conversation.id
                };
                for (const uid of targetIds) {
                  await sendPushToUser(uid, pushPayload);
                }
              } catch (e) {
                console.error('Error al preparar notificación push:', e);
              }
            }
          }
        }
      }
    }
    res.sendStatus(200);
  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.sendStatus(200); // Evitar 500 para que Meta no se bloquee
  }
});


app.get('/api/contacts', authenticateToken, async (req: any, res: any) => {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 200 // Limitar a 200 para no saturar si hay demasiados
    });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching contacts' });
  }
});

app.put('/api/contacts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, city, institution, customFields } = req.body;
    
    const updated = await prisma.contact.update({
      where: { id },
      data: {
        name,
        email,
        customFields
      }
    });
    res.json(updated);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Error updating contact' });
  }
});

// --- ETIQUETAS DE CONTACTOS (TAGS) ---
app.get('/api/contacts/:id/tags', authenticateToken, async (req: any, res: any) => {
  try {
    const tags = await prisma.contactTag.findMany({ where: { contactId: req.params.id } });
    res.json(tags);
  } catch (e) {
    res.status(500).json({ error: 'Error fetching tags' });
  }
});

app.post('/api/contacts/:id/tags', authenticateToken, async (req: any, res: any) => {
  try {
    const { tagName } = req.body;
    if (!tagName || !String(tagName).trim()) return res.status(400).json({ error: 'Nombre de etiqueta requerido' });
    const tag = await prisma.contactTag.upsert({
      where: { contactId_tagName: { contactId: req.params.id, tagName: String(tagName).trim() } },
      update: {},
      create: { contactId: req.params.id, tagName: String(tagName).trim() }
    });
    res.json(tag);
  } catch (e) {
    res.status(500).json({ error: 'Error adding tag' });
  }
});

app.delete('/api/contacts/:id/tags/:tagName', authenticateToken, async (req: any, res: any) => {
  try {
    await prisma.contactTag.deleteMany({ where: { contactId: req.params.id, tagName: req.params.tagName } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Error deleting tag' });
  }
});

// --- DASHBOARD DE MÉTRICAS ---
app.get('/api/stats/dashboard', authenticateToken, async (req: any, res: any) => {
  try {
    const [contacts, conversations, messages, pendingReminders, backorders] = await Promise.all([
      prisma.contact.count(),
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.reminder.count({ where: { isCompleted: false } }),
      prisma.backorder.count()
    ]);
    const all = await prisma.conversation.findMany({ select: { stage: true } });
    const stageCounts: Record<string, number> = {};
    for (const c of all) {
      stageCounts[c.stage] = (stageCounts[c.stage] || 0) + 1;
    }
    res.json({ contacts, conversations, messages, pendingReminders, backorders, stageCounts });
  } catch (e) {
    console.error('Error dashboard:', e);
    res.status(500).json({ error: 'Error dashboard' });
  }
});

// --- PEDIDOS (BACKORDERS) ---
app.post('/api/backorders', authenticateToken, async (req: any, res: any) => {
  try {
    const { contactId, providerId, productName, category, quantity, specification, notes, metadata } = req.body;
    const backorder = await prisma.backorder.create({
      data: {
        contactId,
        productName,
        category,
        quantity: parseInt(quantity) || 1,
        specification,
        notes
      }
    });
    res.json(backorder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creando pedido' });
  }
});


// --- REPORTES DE PEDIDOS (BACKORDERS GLOBALES) ---
app.get('/api/backorders', authenticateToken, async (req: any, res: any) => {
  try {
    const backorders = await prisma.backorder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        contact: {
          select: { name: true, phone: true }
        }
      }
    });
    res.json(backorders);
  } catch (error) {
    console.error('Error fetching backorders:', error);
    res.status(500).json({ error: 'Error cargando backorders' });
  }
});

app.get('/api/contacts/:id/backorders', authenticateToken, async (req: any, res: any) => {
  try {
    const backorders = await prisma.backorder.findMany({
      where: { contactId: req.params.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(backorders);
  } catch (error) {
    res.status(500).json({ error: 'Error cargando pedidos' });
  }
});

// --- RECORDATORIOS ---

app.post('/api/reminders', authenticateToken, async (req: any, res: any) => {
  try {
    const { contactId, scheduledFor, notes } = req.body;
    const reminder = await prisma.reminder.create({
      data: {
        contactId,
        userId: req.user.id,
        scheduledFor: new Date(scheduledFor),
        notes
      },
      include: { contact: true, whatsappLine: true }
    });
    // Emit to this specific user (or broadcast and frontend filters)
    io.emit('new_reminder', reminder);
    res.json(reminder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creando recordatorio' });
  }
});

app.get('/api/reminders', authenticateToken, async (req: any, res: any) => {
  try {
    const reminders = await prisma.reminder.findMany({
      where: {
        userId: req.user.id,
        isCompleted: false
      },
      include: {
        contact: true
      },
      orderBy: {
        scheduledFor: 'asc'
      }
    });
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: 'Error cargando recordatorios' });
  }
});

app.put('/api/reminders/:id/complete', authenticateToken, async (req: any, res: any) => {
  try {
    const reminder = await prisma.reminder.update({
      where: { id: req.params.id },
      data: { isCompleted: true }
    });
    res.json(reminder);
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando recordatorio' });
  }
});

// Reporte de recordatorios (admin: todos los recordatorios con contacto y vendedor)
app.get('/api/reminders/all', authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'SUPERADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'No tienes permisos' });
    }
    const reminders = await prisma.reminder.findMany({
      include: {
        collaborators: true,
        contact: true, user: true },
      orderBy: { scheduledFor: 'desc' }
    });
    res.json(reminders);
  } catch (error) {
    console.error('Error cargando recordatorios:', error);
    res.status(500).json({ error: 'Error cargando recordatorios' });
  }
});



// --- SYSTEM SETTINGS (JSON FILE) ---

const defaultStages = [
  { id: 'NUEVO_LEAD', name: 'Nuevo Lead', color: '#3b82f6' },
  { id: 'EN_NEGOCIACION', name: 'En Negociación', color: '#eab308' },
  { id: 'VENTA_GANADA', name: 'Venta Ganada', color: '#22c55e' },
  { id: 'VENTA_PERDIDA', name: 'Venta Perdida', color: '#ef4444' }
];

const getSettings = async () => {
  let settings = { customContactFields: [], pipelineStages: defaultStages, snippets: [] };
  const record = await prisma.systemSetting.findUnique({ where: { id: "default" } });
  if (record && record.data) {
    const raw = typeof record.data === 'string' ? JSON.parse(record.data) : record.data;
    settings = { ...settings, ...raw };
    if (!settings.pipelineStages || settings.pipelineStages.length === 0) {
      settings.pipelineStages = defaultStages;
    }
  }
  return settings;
};

const saveSettings = async (data: any) => {
  await prisma.systemSetting.upsert({
    where: { id: "default" },
    update: { data },
    create: { id: "default", data }
  });
};

app.get('/api/settings', authenticateToken, async (req: any, res: any) => {
  try {
    res.json(await getSettings());
  } catch (error) {
    res.status(500).json({ error: 'Error fetching settings' });
  }
});

app.put('/api/settings', authenticateToken, async (req: any, res: any) => {
  try {
    const current = await getSettings();
    const next = encryptSensitive({ ...current, ...req.body });
    await saveSettings(next);
    res.json(next);
  } catch (error) {
    res.status(500).json({ error: 'Error updating settings' });
  }
});


// --- HELPDESK CATALOGS ---

app.get('/api/helpdesk/clients', authenticateToken, async (req: any, res: any) => {
  try {
    const line = req.query.line;
    const where = line && line !== 'ALL' ? { businessLine: line } : {};
    const data = await prisma.helpdeskClient.findMany({ where, orderBy: { name: 'asc' } });
    res.json(data);
  } catch (e) { res.status(500).json({error: 'Error'}) }
});
app.post('/api/helpdesk/clients', authenticateToken, async (req: any, res: any) => {
  try {
    const data = await prisma.helpdeskClient.create({ data: req.body });
    res.json(data);
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});
app.put('/api/helpdesk/clients/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const data = await prisma.helpdeskClient.update({ where: { id: req.params.id }, data: req.body });
    res.json(data);
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});
app.delete('/api/helpdesk/clients/:id', authenticateToken, async (req: any, res: any) => {
  try {
    await prisma.helpdeskClient.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});

app.get('/api/helpdesk/equipments', authenticateToken, async (req: any, res: any) => {
  try {
    const line = req.query.line;
    const where = line && line !== 'ALL' ? { businessLine: line } : {};
    const data = await prisma.helpdeskEquipment.findMany({ where, include: { client: true }, orderBy: { name: 'asc' } });
    res.json(data);
  } catch (e) { res.status(500).json({error: 'Error'}) }
});
app.post('/api/helpdesk/equipments', authenticateToken, async (req: any, res: any) => {
  try {
    const data = await prisma.helpdeskEquipment.create({ data: req.body });
    res.json(data);
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});
app.put('/api/helpdesk/equipments/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const data = await prisma.helpdeskEquipment.update({ where: { id: req.params.id }, data: req.body });
    res.json(data);
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});
app.delete('/api/helpdesk/equipments/:id', authenticateToken, async (req: any, res: any) => {
  try {
    await prisma.helpdeskEquipment.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});

app.get('/api/helpdesk/incident-types', authenticateToken, async (req: any, res: any) => {
  try {
    const line = req.query.line;
    const where = line && line !== 'ALL' ? { businessLine: line } : {};
    const data = await prisma.helpdeskIncidentType.findMany({ where, orderBy: { name: 'asc' } });
    res.json(data);
  } catch (e) { res.status(500).json({error: 'Error'}) }
});
app.post('/api/helpdesk/incident-types', authenticateToken, async (req: any, res: any) => {
  try {
    const data = await prisma.helpdeskIncidentType.create({ data: req.body });
    res.json(data);
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});
app.put('/api/helpdesk/incident-types/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const data = await prisma.helpdeskIncidentType.update({ where: { id: req.params.id }, data: req.body });
    res.json(data);
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});
app.delete('/api/helpdesk/incident-types/:id', authenticateToken, async (req: any, res: any) => {
  try {
    await prisma.helpdeskIncidentType.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});

app.get('/api/helpdesk/task-types', authenticateToken, async (req: any, res: any) => {
  try {
    const line = req.query.line;
    const where = line && line !== 'ALL' ? { businessLine: line } : {};
    const data = await prisma.helpdeskTaskType.findMany({ where, orderBy: { name: 'asc' } });
    res.json(data);
  } catch (e) { res.status(500).json({error: 'Error'}) }
});
app.post('/api/helpdesk/task-types', authenticateToken, async (req: any, res: any) => {
  try {
    const data = await prisma.helpdeskTaskType.create({ data: req.body });
    res.json(data);
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});
app.put('/api/helpdesk/task-types/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const data = await prisma.helpdeskTaskType.update({ where: { id: req.params.id }, data: req.body });
    res.json(data);
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});
app.delete('/api/helpdesk/task-types/:id', authenticateToken, async (req: any, res: any) => {
  try {
    await prisma.helpdeskTaskType.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});

// --- RECEPCION ---
app.get('/api/helpdesk/receptions', authenticateToken, async (req: any, res: any) => {
  try {
    const data = await prisma.helpdeskReception.findMany({ orderBy: { name: 'asc' } });
    res.json(data);
  } catch (e) { res.status(500).json({ error: 'Error' }); }
});
app.post('/api/helpdesk/receptions', authenticateToken, async (req: any, res: any) => {
  try { const data = await prisma.helpdeskReception.create({ data: req.body }); res.json(data); }
  catch (error) { res.status(500).json({ error: 'Error' }); }
});
app.put('/api/helpdesk/receptions/:id', authenticateToken, async (req: any, res: any) => {
  try { const data = await prisma.helpdeskReception.update({ where: { id: req.params.id }, data: req.body }); res.json(data); }
  catch (error) { res.status(500).json({ error: 'Error' }); }
});
app.delete('/api/helpdesk/receptions/:id', authenticateToken, async (req: any, res: any) => {
  try { await prisma.helpdeskReception.delete({ where: { id: req.params.id } }); res.json({ success: true }); }
  catch (error) { res.status(500).json({ error: 'Error' }); }
});

// --- SERVICIOS ---
app.get('/api/helpdesk/services', authenticateToken, async (req: any, res: any) => {
  try {
    const line = req.query.line;
    const where = line && line !== 'ALL' ? { businessLine: line } : {};
    const data = await prisma.helpdeskService.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(data);
  } catch (e) { res.status(500).json({ error: 'Error' }); }
});
app.post('/api/helpdesk/services', authenticateToken, async (req: any, res: any) => {
  try { const data = await prisma.helpdeskService.create({ data: req.body }); res.json(data); }
  catch (error) { res.status(500).json({ error: 'Error' }); }
});
app.put('/api/helpdesk/services/:id', authenticateToken, async (req: any, res: any) => {
  try { const data = await prisma.helpdeskService.update({ where: { id: req.params.id }, data: req.body }); res.json(data); }
  catch (error) { res.status(500).json({ error: 'Error' }); }
});
app.delete('/api/helpdesk/services/:id', authenticateToken, async (req: any, res: any) => {
  try { await prisma.helpdeskService.delete({ where: { id: req.params.id } }); res.json({ success: true }); }
  catch (error) { res.status(500).json({ error: 'Error' }); }
});

// --- TIPOS ETA ---
app.get('/api/helpdesk/eta-types', authenticateToken, async (req: any, res: any) => {
  try {
    const line = req.query.line;
    const where = line && line !== 'ALL' ? { businessLine: line } : {};
    const data = await prisma.helpdeskEtaType.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(data);
  } catch (e) { res.status(500).json({ error: 'Error' }); }
});
app.post('/api/helpdesk/eta-types', authenticateToken, async (req: any, res: any) => {
  try { const data = await prisma.helpdeskEtaType.create({ data: req.body }); res.json(data); }
  catch (error) { res.status(500).json({ error: 'Error' }); }
});
app.put('/api/helpdesk/eta-types/:id', authenticateToken, async (req: any, res: any) => {
  try { const data = await prisma.helpdeskEtaType.update({ where: { id: req.params.id }, data: req.body }); res.json(data); }
  catch (error) { res.status(500).json({ error: 'Error' }); }
});
app.delete('/api/helpdesk/eta-types/:id', authenticateToken, async (req: any, res: any) => {
  try { await prisma.helpdeskEtaType.delete({ where: { id: req.params.id } }); res.json({ success: true }); }
  catch (error) { res.status(500).json({ error: 'Error' }); }
});
app.get('/api/helpdesk/providers', authenticateToken, async (req: any, res: any) => {
  try {
    const line = req.query.line;
    const where = line && line !== 'ALL' ? { businessLine: line } : {};
    const data = await prisma.helpdeskProvider.findMany({ where, orderBy: { name: 'asc' } });
    res.json(data);
  } catch (e) { res.status(500).json({error: 'Error'}) }
});
app.post('/api/helpdesk/providers', authenticateToken, async (req: any, res: any) => {
  try {
    const data = await prisma.helpdeskProvider.create({ data: req.body });
    res.json(data);
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});
app.put('/api/helpdesk/providers/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const data = await prisma.helpdeskProvider.update({ where: { id: req.params.id }, data: req.body });
    res.json(data);
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});
app.delete('/api/helpdesk/providers/:id', authenticateToken, async (req: any, res: any) => {
  try {
    await prisma.helpdeskProvider.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});

app.get('/api/helpdesk/spare-parts', authenticateToken, async (req: any, res: any) => {
  try {
    const line = req.query.line;
    const where = line && line !== 'ALL' ? { businessLine: line } : {};
    const data = await prisma.helpdeskSparePart.findMany({ where, orderBy: { name: 'asc' } });
    res.json(data);
  } catch (e) { res.status(500).json({error: 'Error'}) }
});
app.post('/api/helpdesk/spare-parts', authenticateToken, async (req: any, res: any) => {
  try {
    const data = await prisma.helpdeskSparePart.create({ data: req.body });
    res.json(data);
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});
app.put('/api/helpdesk/spare-parts/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const data = await prisma.helpdeskSparePart.update({ where: { id: req.params.id }, data: req.body });
    res.json(data);
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});
app.delete('/api/helpdesk/spare-parts/:id', authenticateToken, async (req: any, res: any) => {
  try {
    await prisma.helpdeskSparePart.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});


  app.get('/api/tickets', authenticateToken, async (req: any, res: any) => {
  try {
    const reqLine = req.query.line;
    const userLine = req.user.businessLine || 'SM';
    let filterLine = userLine;
    if (userLine === 'ALL' && reqLine) {
      filterLine = reqLine;
    }
    const whereClause: any = filterLine === 'ALL' ? {} : { businessLine: filterLine };
    const data = await prisma.ticket.findMany({ 
      where: whereClause,
      include: { client: true, assignedUser: true, reports: { include: { technician: true } } },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(data);
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});


app.post('/api/tickets', authenticateToken, async (req: any, res: any) => {
    try {
      const payload = { ...req.body };
      if (!payload.businessLine) payload.businessLine = req.user?.businessLine === 'ALL' ? 'SM' : (req.user?.businessLine || 'SM');
    if (!payload.clientId) payload.clientId = null;
    if (!payload.assignedUserId) payload.assignedUserId = null;
    
    const data = await prisma.ticket.create({ data: payload });
    res.json(data);
  } catch (error) { 
    console.error(error);
    res.status(500).json({ error: 'Error' }); 
  }
});


app.put('/api/tickets/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const payload = { ...req.body };
    if (!payload.clientId) payload.clientId = null;
    if (!payload.assignedUserId) payload.assignedUserId = null;

    const data = await prisma.ticket.update({
      where: { id: req.params.id },
      data: payload
    });
    res.json(data);
  } catch (error) { 
    console.error(error);
    res.status(500).json({ error: 'Error' }); 
  }
});

app.get('/api/tickets/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const data = await prisma.ticket.findUnique({ 
      where: { id: req.params.id },
      include: { client: true, assignedUser: true, reports: { include: { technician: true } } }
    });
    res.json(data);
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});

app.post('/api/tickets/:id/reports', authenticateToken, async (req: any, res: any) => {
  try {
    const data = await prisma.ticketReport.create({ 
      data: { ...req.body, ticketId: req.params.id }
    });
    res.json(data);
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});

app.put('/api/tickets/:id/reports/:reportId', authenticateToken, async (req: any, res: any) => {
  try {
    const data = await prisma.ticketReport.update({
      where: { id: req.params.reportId },
      data: req.body
    });
    res.json(data);
  } catch (error) { res.status(500).json({ error: 'Error' }); }
});

const PORT = process.env.PORT || 3001;

const uploadExcel = multer({ dest: 'uploads/' });
app.post('/api/helpdesk/upload-excel', authenticateToken, uploadExcel.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const targetType = req.body.type;
    const businessLine = req.body.line || 'SM';
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    let count = 0;

    for (const row of data as any[]) {
      if (targetType === 'clients') {
        const name = row.Empresa_Nombres || row.Empresa || row.Nombre;
        if (!name) continue;
        const existing = await prisma.helpdeskClient.findFirst({ where: { businessLine, name: String(name).trim() } });
        if (!existing) { 
          await prisma.helpdeskClient.create({ data: { businessLine, name: String(name).trim(), cedula: String(row.Cedula || row.RUC || ''), lastNames: String(row.Apellidos || '') } }); 
          count++; 
        }
      } else if (targetType === 'equipments') {
        const name = row.Equipo_Sistema || row['Nombre Equipo'] || row.Equipo || row.Producto;
        if (!name) continue;
        
        let clientId = null;
        if (row.Cedula_Cliente || row.Cliente) {
          const clientQuery = String(row.Cedula_Cliente || row.Cliente).trim();
          const client = await prisma.helpdeskClient.findFirst({
            where: { 
              businessLine, 
              OR: [ { cedula: clientQuery }, { name: clientQuery } ]
            }
          });
          if (client) clientId = client.id;
        }

        const existing = await prisma.helpdeskEquipment.findFirst({ where: { businessLine, name: String(name).trim() } });
        if (!existing) { 
          await prisma.helpdeskEquipment.create({ data: { businessLine, name: String(name).trim(), brand: String(row.Marca || ''), model: String(row.Modelo || ''), serial: String(row.Serie || ''), clientId } }); 
          count++; 
        } else if (clientId && !existing.clientId) {
          await prisma.helpdeskEquipment.update({ where: { id: existing.id }, data: { clientId } });
        }
      } else if (targetType === 'incident-types') {
        const name = row.Nombre || row['Servicio a brindar'] || row.Incidencia;
        if (!name) continue;
        const existing = await prisma.helpdeskIncidentType.findFirst({ where: { businessLine, name: String(name).trim() } });
        if (!existing) { await prisma.helpdeskIncidentType.create({ data: { businessLine, name: String(name).trim() } }); count++; }
      } else if (targetType === 'task-types') {
        const name = row.Nombre || row.Tarea;
        if (!name) continue;
        const existing = await prisma.helpdeskTaskType.findFirst({ where: { businessLine, name: String(name).trim() } });
        if (!existing) { await prisma.helpdeskTaskType.create({ data: { businessLine, name: String(name).trim() } }); count++; }
      } else if (targetType === 'providers') {
        const name = row.Nombre || row.Proveedor || row.Empresa;
        if (!name) continue;
        const existing = await (prisma as any).helpdeskProvider.findFirst({ where: { businessLine, name: String(name).trim() } });
        if (!existing) { await (prisma as any).helpdeskProvider.create({ data: { businessLine, name: String(name).trim() } }); count++; }
      } else if (targetType === 'spare-parts') {
        const name = row.Nombre || row.Repuesto || row.Producto;
        if (!name) continue;
        const existing = await (prisma as any).helpdeskSparePart.findFirst({ where: { businessLine, name: String(name).trim() } });
        if (!existing) { await (prisma as any).helpdeskSparePart.create({ data: { businessLine, name: String(name).trim() } }); count++; }
      } else if (targetType === 'receptions') {
        const name = row['Nombre'];
        if (!name) continue;
        const existing = await prisma.helpdeskReception.findFirst({ where: { name: String(name).trim() } });
        if (!existing) { await prisma.helpdeskReception.create({ data: { name: String(name).trim(), code: String(row['Id Recepcion'] || '') } }); count++; }
      } else if (targetType === 'services') {
        const type = row['Tipo'];
        if (!type) continue;
        const existing = await prisma.helpdeskService.findFirst({ where: { businessLine, type: String(type).trim() } });
        if (!existing) { await prisma.helpdeskService.create({ data: { businessLine, code: String(row['Id Servicio'] || ''), type: String(type).trim(), description: String(row['Descripcion'] || ''), flow: String(row['Flujo asignado'] || ''), estimatedPrice: String(row['Precio Estimado'] || '') } }); count++; }
      } else if (targetType === 'eta-types') {
        const type = row['Tipo'];
        if (!type) continue;
        const existing = await prisma.helpdeskEtaType.findFirst({ where: { businessLine, type: String(type).trim() } });
        if (!existing) { await prisma.helpdeskEtaType.create({ data: { businessLine, code: String(row['Id Tipo ETA'] || ''), type: String(type).trim(), description: String(row['Descripcion'] || ''), service: String(row['Servicio'] || '') } }); count++; }
      }
    }
    
    fs.unlinkSync(req.file.path);
    res.json({ success: true, count });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/run-dedup', async (req: any, res: any) => {
  try {
    const models = ['helpdeskClient', 'helpdeskEquipment', 'helpdeskIncidentType', 'helpdeskTaskType', 'helpdeskProvider', 'helpdeskSparePart'];
    const results: Record<string, any> = {};

    for (const modelName of models) {
      const allRecords = await (prisma as any)[modelName].findMany();
      const seen = new Map();
      const toDelete = [];

      for (const record of allRecords) {
        const key = `${record.businessLine}_${record.name.trim().toLowerCase()}`;
        if (seen.has(key)) {
          toDelete.push(record.id);
        } else {
          seen.set(key, record.id);
        }
      }

      if (toDelete.length > 0) {
        for (const id of toDelete) {
          try {
            const record = allRecords.find((r: any) => r.id === id);
            const keptId = seen.get(`${record.businessLine}_${record.name.trim().toLowerCase()}`);
            
            if (modelName === 'helpdeskClient') {
              await prisma.ticket.updateMany({ where: { clientId: id }, data: { clientId: keptId } });
              await prisma.helpdeskEquipment.updateMany({ where: { clientId: id }, data: { clientId: keptId } });
            } else if (modelName === 'helpdeskEquipment') {
              // equipmentId not in Ticket
            } else if (modelName === 'helpdeskProvider') {
              await prisma.backorder.updateMany({ where: { providerId: id }, data: { providerId: keptId } });
            }
            await (prisma as any)[modelName].delete({ where: { id } });
          } catch (err) {
            console.error(err);
          }
        }
        results[modelName] = `Deleted ${toDelete.length} duplicates`;
      } else {
        results[modelName] = 'No duplicates found';
      }
    }
    res.json({ success: true, results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/run-seed', async (req: any, res: any) => {
  try {
    const data = {
  "clientes": [
    {
      "ID Cliente": "IDCL3D0001",
      "Cedula": "0923494298",
      "Nombre": "GIANDRI SANIN",
      "Apellidos": "MOREIRA RODRIGUEZ",
      "Correo": "giandri_mr20@hotmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0980394225",
      "Direccion": "AV. Carlos Guevera Moreno y Av.Jose de Antepara",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0002",
      "Cedula": "0927307124001",
      "Nombre": "Wilson Esteban",
      "Apellidos": "Loor Murillo",
      "Correo": "wilsonloor-m@hotmail.com",
      "Telefono": "0939450004",
      "Direccion": "Guayaquil",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0003",
      "Cedula": "0993101907001",
      "Empresa": "Laserdeco S.A.",
      "Nombre": "Laserdeco S.A.",
      "Apellidos": "Jorge Muñoz",
      "Correo": "administracion@laserdecoec.ec",
      "Ciudad": "Guayas",
      "Telefono": "0969527739",
      "Direccion": "Guayaquil",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0004",
      "Cedula": "0927537738",
      "Nombre": "Christian Xavier",
      "Apellidos": "Cruz Malusin",
      "Correo": "christiancruks@hotmail.com",
      "Telefono": "0988184096",
      "Direccion": "Guayaquil",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0005",
      "Cedula": "0993069876001",
      "Empresa": "Centro Educativo Jean Piaget",
      "Correo": "albohispano.jeanpiaget@gmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0982858325",
      "Direccion": "Guayacanes 3ra Etapa - MZ 97 - 97A",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0006",
      "Cedula": "0931475651",
      "Nombre": "Luis Xavier",
      "Apellidos": "Cueva Zuñiga",
      "Correo": "luiscuevaz@hotmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0992890871",
      "Direccion": "Sauces 2 Mz F114 V81",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0007",
      "Cedula": "0931885040",
      "Nombre": "Romero Ricardo",
      "Apellidos": "Leon De La Torre",
      "Correo": "ricardoleon2602@gmaul.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0987976668",
      "Direccion": "Alborada 10ma etapa",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0008",
      "Cedula": "0911248979001",
      "Nombre": "Ruth Asuncion",
      "Apellidos": "Aviles Peñafiel",
      "Correo": "asuncionaviles1@gmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0969315872",
      "Direccion": "Guayaquil",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0009",
      "Cedula": "0925680761",
      "Nombre": "Luis Jeremy",
      "Apellidos": "Baño Medina",
      "Correo": "luisitobm123@hotmail.com",
      "Telefono": "0980690185",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0010",
      "Cedula": "0993391160001",
      "Empresa": "DNAOMI ODONTOLOGIA MEDICO INTEGRAL S.A.S.",
      "Nombre": "Christian",
      "Apellidos": "Barco",
      "Correo": "barcodental.lab@gmail.com",
      "Ciudad": "Guayaquil",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0011",
      "Cedula": "0103393609001",
      "Nombre": "Raul Alejandro",
      "Apellidos": "Guerra Goes",
      "Correo": "info@guerragoes.com",
      "Telefono": "0997106700",
      "Direccion": "Guayaquil, Km 12 Vía Samborondón",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0012",
      "Cedula": "0920232147",
      "Nombre": "Bolivar Alejandro",
      "Apellidos": "Mosquera Barrera",
      "Correo": "skyledecuador@gmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0988690909",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0013",
      "Cedula": "0928876986",
      "Nombre": "Joel Alexander",
      "Apellidos": "Parada Campoverde",
      "Correo": "paradajoel16@gmail.com",
      "Telefono": "0994220480",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0014",
      "Cedula": "0927919910001",
      "Nombre": "María Lorena",
      "Apellidos": "Berardo Galvan",
      "Correo": "marialorenaberardo@gmail.com",
      "Telefono": "0959094445",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0015",
      "Cedula": "1759400961001",
      "Nombre": "Jose Manuel",
      "Apellidos": "Rincon Perez",
      "Correo": "navysmilelaboratoriodental@gmail.com",
      "Telefono": "0969471312",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0016",
      "Cedula": "0993379565001",
      "Empresa": "SMARTCAMPS S.A.S.",
      "Nombre": "SMARTCAMPS S.A.S.",
      "Apellidos": "SMARTCAMPS S.A.S.",
      "Correo": "smartcamp.ec@gmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0994113513",
      "Direccion": "Vía a la Costa Km 13 C.C. Bluecoast local 31 planta alta",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0017",
      "Cedula": "0916483696001",
      "Nombre": "Ronald Jonnathan",
      "Apellidos": "Fuentes Jaramillo",
      "Correo": "ronaldfuentes_2005@hotmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0995583749",
      "Direccion": "Kenedy Norte",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0018",
      "Cedula": "0400758439",
      "Nombre": "Mayra",
      "Apellidos": "Marilanda Villarreal",
      "Correo": "mayravillarreal2010@hotmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0987758941",
      "Direccion": "Av. Francisco Orellena",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0019",
      "Cedula": "0702610098",
      "Nombre": "Aldo Rodrigo",
      "Apellidos": "Martinez Barrera",
      "Correo": "armb1221@gmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0987612454",
      "Direccion": "Ciudad Celeste",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0020",
      "Cedula": "0911280188",
      "Nombre": "Bernando José",
      "Apellidos": "Henriques Sayago",
      "Correo": "bhenriques@gmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0986947315",
      "Direccion": "Ceibos",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0021",
      "Cedula": "1804376240",
      "Nombre": "Hugo Xavier",
      "Apellidos": "Alvarez Saltos",
      "Correo": "hugoxavieralvarezsaltos@gmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0992614707",
      "Direccion": "Km 34.5 Via la Costa",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0022",
      "Cedula": "1205790502",
      "Nombre": "Victor Antonio",
      "Apellidos": "Armijos Laniz",
      "Correo": "victorarmijoslaniz@hotmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0985969587",
      "Direccion": "Babahoyo",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0023",
      "Cedula": "0929467363",
      "Nombre": "Eduardo Antonio",
      "Apellidos": "Bazurto Rodríguez",
      "Correo": "bazurtoeduardo97@gmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0993557948",
      "Direccion": "Duran cope ejército",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0024",
      "Cedula": "0922617030",
      "Nombre": "Xavier Andres",
      "Apellidos": "Coello Aguilera",
      "Correo": "xcaguilera88@gmail.com",
      "Ciudad": "Milagro",
      "Telefono": "0968712318",
      "Direccion": "Milagro",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0025",
      "Cedula": "0931916178",
      "Nombre": "Ney Salomon",
      "Apellidos": "Alava Rosado",
      "Correo": "neyalava98@gmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0999634876",
      "Direccion": "Samanes 2",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0026",
      "Cedula": "0956733729",
      "Nombre": "Christopher Eliux",
      "Apellidos": "Villegas Triviño",
      "Correo": "eliux_11villegas@hotmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0987583744",
      "Direccion": "San Felipe",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0027",
      "Cedula": "0958732489",
      "Nombre": "Elkin David",
      "Apellidos": "Bastidas Triana",
      "Correo": "basco.dental@gmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "09611660025",
      "Direccion": "Circunvalación Sur entre Ficus y Guayacanes",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0028",
      "Cedula": "0904885068",
      "Nombre": "Angel Rogelio",
      "Apellidos": "Benavides Brito",
      "Correo": "britoangelrojo@hotmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0959900736",
      "Direccion": "Bloques del seguro y Av Quito",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0029",
      "Cedula": "0922536164",
      "Nombre": "Carlos Alberto",
      "Apellidos": "Rodas Pazmiño",
      "Correo": "carlos.rodas@cnel.gob.ec",
      "Ciudad": "Guayaquil",
      "Telefono": "0969687428",
      "Direccion": "Mucho lote 2 paraiso del rio 1",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0030",
      "Cedula": "0993069876001",
      "Empresa": "Centro Educativo Jean Piaget Cia. Ltda",
      "Nombre": "Centro Educativo Jean Piaget Cia. Ltda",
      "Apellidos": "Centro Educativo Jean Piaget Cia. Ltda",
      "Correo": "albohispano.jeanpiaget@gmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0982858325",
      "Direccion": "Guayacanes 3ra Etapa - MZ 97 - 97A",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0031",
      "Cedula": "120238456",
      "Nombre": "Danilo",
      "Apellidos": "Peña Ochoa",
      "Correo": "joelpe8a@gmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0984553730",
      "Direccion": "Alborada 6",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0032",
      "Cedula": "0930220207",
      "Nombre": "Tyrone Andres",
      "Apellidos": "Toala Delgado",
      "Correo": "dandrest93@gmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0978676783",
      "Direccion": "Urdesa",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0033",
      "Cedula": "0923770887",
      "Nombre": "Pamela Estefany",
      "Apellidos": "Moreno Patiño",
      "Correo": "pam.morenop@gmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0991647191",
      "Direccion": "Guayacanes mz 237 v 14",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0034",
      "Cedula": "09544248100",
      "Nombre": "Adrian Andres",
      "Apellidos": "Vera Basurto",
      "Correo": "adrianandresverabasurto@gmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0978708309",
      "Direccion": "11 y General Gomez",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0035",
      "Cedula": "0909557068",
      "Nombre": "Oswaldo Fabricio",
      "Apellidos": "Moran Hermosilla",
      "Correo": "oswaldomora@hotmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0996464666",
      "Direccion": "Sucre 424 y chimborazo",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0036",
      "Cedula": "0963672357",
      "Nombre": "Sainner Mariver",
      "Apellidos": "Salas Moreno",
      "Correo": "ssalas.ec@gmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0962546939",
      "Direccion": "Urb. La Rioja",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0037",
      "Cedula": "1804848420001",
      "Nombre": "Andrés Sebastián",
      "Apellidos": "Rivera Sánchez",
      "Correo": "sebandy126@hotmail.com",
      "Ciudad": "Ambato",
      "Telefono": "0995755462",
      "Direccion": "Ambato",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0038",
      "Cedula": "0908580483",
      "Nombre": "Guillermo Virgilio",
      "Apellidos": "Silva Bazan",
      "Correo": "Guillesilva2005@gmail.com",
      "Ciudad": "Santa Elena",
      "Telefono": "0967581271",
      "Direccion": "La Libertad",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0039",
      "Cedula": "0915515886",
      "Nombre": "Francisco",
      "Apellidos": "Velasquez",
      "Correo": "fjvlsqzp@gmail.com",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0040",
      "Cedula": "0930585260",
      "Nombre": "Mauro",
      "Apellidos": "Alcivar Manzo",
      "Correo": "mauroalcivarmanzo@gmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0998924199",
      "Direccion": "Guayaquil",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0041",
      "Cedula": "0917372161",
      "Nombre": "Marcia Elizabeth",
      "Apellidos": "Juanazo Paucar",
      "Correo": "ing.confiabilidad@hotmail.es",
      "Ciudad": "Guayaquil",
      "Telefono": "0988771846",
      "Direccion": "Villa Club",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0042",
      "Cedula": "0918783556",
      "Nombre": "Mishel Gabriela",
      "Apellidos": "Rosas Vallejos",
      "Correo": "rosas.mishel@yahoo.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0996317873",
      "Direccion": "Guayaquil",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0043",
      "Cedula": "0956733729",
      "Nombre": "Cristopher Eliux",
      "Apellidos": "Villegas Triviño",
      "Correo": "eliux_11villegas@hotmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0987583744",
      "Direccion": "San Felipe",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0044",
      "Cedula": "0992255668001",
      "Empresa": "UNIDAD EDUCATIVA PARTICULAR SAN LUIS REY DE FRANCIA",
      "Nombre": "UNIDAD EDUCATIVA PARTICULAR SAN LUIS REY DE FRANCIA",
      "Apellidos": "UNIDAD EDUCATIVA PARTICULAR SAN LUIS REY DE FRANCIA",
      "Correo": "colecturia@sanluisreydefrancia.edu.ec",
      "Ciudad": "Guayaquil",
      "Telefono": "042478640",
      "Direccion": "ARGENTINA #4419 entre salinas (18ava) y Samborondon (19ava), Guayaquil",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0045",
      "Cedula": "0940905508",
      "Nombre": "OSCAR ALFONSO",
      "Apellidos": "MENDOZA BALON",
      "Correo": "mendozaoscar362@gmail.com",
      "Ciudad": "Guayaquil +",
      "Telefono": "0982241176",
      "Direccion": "Sauces 3",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0046",
      "Cedula": "0952226074",
      "Nombre": "Jonathan Steven",
      "Apellidos": "Vélez Manzaba",
      "Correo": "jsvm159@gmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0991713274",
      "Direccion": "12 y cedalana",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0047",
      "Cedula": "0910939461",
      "Nombre": "SANDRA MIRELLA",
      "Apellidos": "GARCIA GARAICOA",
      "Correo": "sandragarcia67@hotmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0990252482",
      "Direccion": "Alborada",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0048",
      "Cedula": "0922533922",
      "Nombre": "Ricardo Alberto",
      "Apellidos": "Torres Carbo",
      "Correo": "ricardo_torrescarbo@hotmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0985920246",
      "Direccion": "Sauces 4",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0049",
      "Cedula": "0923507354",
      "Nombre": "Manuel Andres",
      "Apellidos": "Ochoa Galarza",
      "Correo": "andresxxx3000@gmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0993913496",
      "Direccion": "Guayaquil",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0050",
      "Cedula": "1301595557",
      "Nombre": "Maria Elena",
      "Apellidos": "Moreira Garcia",
      "Correo": "titamoreirag@gmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "098861085",
      "Direccion": "Guayaquil",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0051",
      "Cedula": "0954574729",
      "Nombre": "Gladys Isabel",
      "Apellidos": "Bueno Aguirre",
      "Correo": "isabelstore.ec@gmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0959745481",
      "Direccion": "av quito y letamendi",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0052",
      "Cedula": "0914630140",
      "Nombre": "Ney Ricardo",
      "Apellidos": "Palma Castillo",
      "Correo": "ney_palma@yahoo.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0997570184",
      "Direccion": "Garzota",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0053",
      "Cedula": "09251202030",
      "Empresa": "Jose Vera",
      "Nombre": "Jose Vera",
      "Apellidos": "Jose Vera",
      "Correo": "josefvd@icloud.com",
      "Telefono": "0993170355",
      "Direccion": "Samborondon Urb . El Cortijo",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0054",
      "Cedula": "2450092412",
      "Nombre": "Belen Estefania",
      "Apellidos": "Orrala Mendez",
      "Correo": "b.orralamendez@gmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0962183828",
      "Direccion": "Guayacanes mz87 v 8",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0055",
      "Cedula": "1707229025",
      "Nombre": "MARIA SOLEDAD",
      "Apellidos": "REGALADO BENAVIDES",
      "Correo": "soleregalado@gmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0999213399",
      "Direccion": "Samborondon km 2,5  Urbanización Central Park",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0056",
      "Cedula": "1315491850",
      "Nombre": "Pedro Carlos",
      "Apellidos": "Quiroz Cedeño",
      "Correo": "pcquirozc@gmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0963247386",
      "Direccion": "Cuidadela pajaro azul",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0057",
      "Cedula": "0704105360",
      "Nombre": "Jessica Lady",
      "Apellidos": "Morocho Burgos",
      "Correo": "jemobu@hotmail.com",
      "Ciudad": "Machala",
      "Telefono": "0958926465",
      "Direccion": "Machala",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0058",
      "Cedula": "0705697928",
      "Nombre": "Flanklin Javier",
      "Apellidos": "Armijos Aguilar",
      "Correo": "djjavierarmijos@gmail.com",
      "Ciudad": "Machala",
      "Telefono": "0979838361",
      "Direccion": "El Pasaje",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0059",
      "Cedula": "0603579384001",
      "Nombre": "Byron Stalin",
      "Apellidos": "Escudero Mata",
      "Correo": "dr.byronescudero@gmail.com",
      "Ciudad": "Riobamba",
      "Telefono": "0992384467",
      "Direccion": "Riobamba",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0060",
      "Cedula": "0927530493",
      "Nombre": "Hector Alexander",
      "Apellidos": "Pesantez Cepeda",
      "Correo": "alex_pesa_88@hotmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0986491936",
      "Direccion": "Via la costa",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0061",
      "Cedula": "0916653462",
      "Nombre": "Rafael Arturo",
      "Apellidos": "Alcívar Miranda",
      "Correo": "rafael.alcivar@gmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0987413777",
      "Direccion": "Guayaquil",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0062",
      "Cedula": "0705158400",
      "Nombre": "Christian Andres",
      "Apellidos": "Luzuriaga Jarre",
      "Correo": "luzu_18@hotmail.com",
      "Ciudad": "Machala",
      "Telefono": "0980709117",
      "Direccion": "Machala",
      "Linea de Negocio": "3D"
    },
    {
      "ID Cliente": "IDCL3D0063",
      "Cedula": "0930404827",
      "Nombre": "Alfonso Dioniso",
      "Apellidos": "Espinoza Moran",
      "Correo": "ponchoaem@gmail.com",
      "Ciudad": "Guayaquil",
      "Telefono": "0999670010",
      "Direccion": "Ciudadela El Rio 2",
      "Linea de Negocio": "3D"
    }
  ],
  "equipos": [
    {
      "ID Equipo": "IDE3D0001",
      "ID Cliente": "IDCL3D0001",
      "Nombre Equipo": "Magician",
      "Modelo": "X2 3D printer",
      "Marca": "Mingda",
      "Serie": "MX22316A0800022"
    },
    {
      "ID Equipo": "IDE3D0002",
      "ID Cliente": "IDCL3D0005",
      "Nombre Equipo": "Impresora 3D Filamento",
      "Modelo": "Genius pro",
      "Marca": "Artillery",
      "Serie": "GP18082025JP"
    },
    {
      "ID Equipo": "IDE3D0003",
      "ID Cliente": "IDCL3D0008",
      "Nombre Equipo": "SLA",
      "Modelo": "Halot r6",
      "Marca": "Creality",
      "Serie": "IRC22082025"
    },
    {
      "ID Equipo": "IDE3D0004",
      "ID Cliente": "IDCL3D0009",
      "Nombre Equipo": "FDM",
      "Modelo": "MK3 S",
      "Marca": "PRUSA"
    },
    {
      "ID Equipo": "IDE3D0005",
      "ID Cliente": "IDCL3D0010",
      "Nombre Equipo": "SLA",
      "Modelo": "Halot One",
      "Marca": "Creality"
    },
    {
      "ID Equipo": "IDE3D0006",
      "ID Cliente": "IDCL3D0011",
      "Nombre Equipo": "SLA",
      "Modelo": "ELEGOO"
    },
    {
      "ID Equipo": "IDE3D0007",
      "ID Cliente": "IDCL3D0012",
      "Nombre Equipo": "FDM",
      "Modelo": "DELTA",
      "Marca": "SeeMeCNC"
    },
    {
      "ID Equipo": "IDE3D0008",
      "ID Cliente": "IDCL3D0013",
      "Nombre Equipo": "FDM",
      "Modelo": "KOBRA 2",
      "Marca": "ANYCUBIC"
    },
    {
      "ID Equipo": "IDE3D0009",
      "ID Cliente": "IDCL3D0014",
      "Nombre Equipo": "SLA",
      "Modelo": "Photon X6KS",
      "Marca": "Anycubic"
    },
    {
      "ID Equipo": "IDE3D0010",
      "ID Cliente": "IDCL3D0015",
      "Nombre Equipo": "SLA",
      "Modelo": "HALOT MAGE S",
      "Marca": "CREALITY"
    },
    {
      "ID Equipo": "IDE3D0011",
      "ID Cliente": "IDCL3D0016",
      "Nombre Equipo": "FDM",
      "Modelo": "A1",
      "Marca": "BAMBULAB"
    },
    {
      "ID Equipo": "IDE3D0012",
      "ID Cliente": "IDCL3D0017",
      "Nombre Equipo": "Impresora 3D SLA",
      "Modelo": "Saturn 3 ultra",
      "Marca": "Elegoo",
      "Serie": "219239194"
    },
    {
      "ID Equipo": "IDE3D0013",
      "ID Cliente": "IDCL3D0018",
      "Nombre Equipo": "Impresora FDM",
      "Modelo": "Ender 3 V2",
      "Marca": "Creality",
      "Serie": "12211001020084"
    },
    {
      "ID Equipo": "IDE3D0014",
      "ID Cliente": "IDCL3D0018",
      "Nombre Equipo": "Impresora FDM",
      "Modelo": "Ender 3 V2",
      "Marca": "Creality",
      "Serie": "12391001020084"
    },
    {
      "ID Equipo": "IDE3D0015",
      "ID Cliente": "IDCL3D0019",
      "Nombre Equipo": "FDM",
      "Modelo": "K1 MAX",
      "Marca": "CREALITY",
      "Serie": "100006481715824ANLX"
    },
    {
      "ID Equipo": "IDE3D0016",
      "ID Cliente": "IDCL3D0015",
      "Nombre Equipo": "Anycubic SLA",
      "Modelo": "Photon Mono M5S Pro",
      "Marca": "Anycubic"
    },
    {
      "ID Equipo": "IDE3D0017",
      "ID Cliente": "IDCL3D0020",
      "Nombre Equipo": "CREALITY SLA",
      "Modelo": "Creality Ld006",
      "Marca": "Creality Ld006"
    },
    {
      "ID Equipo": "IDE3D0018",
      "ID Cliente": "IDCL3D0021",
      "Nombre Equipo": "BAMBU LAB A1",
      "Modelo": "A1",
      "Marca": "BAMBULAB"
    },
    {
      "ID Equipo": "IDE3D0019",
      "ID Cliente": "IDCL3D0022",
      "Nombre Equipo": "Creality Ender 3 V3 SE",
      "Modelo": "Ender 3 V3 SE",
      "Marca": "Creality",
      "Serie": "1000078502335245EDV"
    },
    {
      "ID Equipo": "IDE3D0020",
      "ID Cliente": "IDCL3D0019",
      "Nombre Equipo": "IMPRESORA 3D FDM",
      "Modelo": "SNAP",
      "Marca": "MAKER",
      "Serie": "SM18092025"
    },
    {
      "ID Equipo": "IDE3D0021",
      "ID Cliente": "IDCL3D0023",
      "Nombre Equipo": "Impresora 3D FDM",
      "Modelo": "CR-30",
      "Marca": "Creality",
      "Serie": "10000475981D123EFDG"
    },
    {
      "ID Equipo": "IDE3D0022",
      "ID Cliente": "IDCL3D0024",
      "Nombre Equipo": "Impresora 3D FDM",
      "Modelo": "Ender 3 V3 Plus",
      "Marca": "Creality",
      "Serie": "10000724391s824fisz"
    },
    {
      "ID Equipo": "IDE3D0023",
      "ID Cliente": "IDCL3D0025",
      "Nombre Equipo": "Impresora 3D FDM",
      "Modelo": "Ender 3 v3",
      "Marca": "Creality"
    },
    {
      "ID Equipo": "IDE3D0024",
      "ID Cliente": "IDCL3D0026",
      "Nombre Equipo": "Impresora 3D FDM",
      "Modelo": "K2 PLUS COMBO",
      "Marca": "Creality"
    },
    {
      "ID Equipo": "IDE3D0025",
      "ID Cliente": "IDCL3D0027",
      "Nombre Equipo": "Impresora 3D SLA",
      "Modelo": "Photon Mono X2",
      "Marca": "Anycubic"
    },
    {
      "ID Equipo": "IDE3D0026",
      "ID Cliente": "IDCL3D0028",
      "Nombre Equipo": "Impresora 3D FDM",
      "Modelo": "MK3S",
      "Marca": "Prusa"
    },
    {
      "ID Equipo": "IDE3D0027",
      "ID Cliente": "IDCL3D0029",
      "Nombre Equipo": "Impresora 3D FDM",
      "Modelo": "Ender 3 max neo",
      "Marca": "Creality"
    },
    {
      "ID Equipo": "IDE3D0028",
      "ID Cliente": "IDCL3D0030",
      "Nombre Equipo": "Impresora 3D",
      "Modelo": "Genius Pro",
      "Marca": "Artillery"
    },
    {
      "ID Equipo": "IDE3D0029",
      "ID Cliente": "IDCL3D0031",
      "Nombre Equipo": "Impresora 3D",
      "Modelo": "Ender 3 v 2 neo",
      "Marca": "Creality"
    },
    {
      "ID Equipo": "IDE3D0030",
      "ID Cliente": "IDCL3D0032",
      "Nombre Equipo": "Impresora 3D FDM",
      "Modelo": "Ender 3 V3 SE",
      "Marca": "Creality"
    },
    {
      "ID Equipo": "IDE3D0031",
      "ID Cliente": "IDCL3D0032",
      "Nombre Equipo": "Impresora 3D",
      "Modelo": "Ender 3 V2 Neo",
      "Marca": "Creality"
    },
    {
      "ID Equipo": "IDE3D0032",
      "ID Cliente": "IDCL3D0033",
      "Nombre Equipo": "Impresora 3D",
      "Modelo": "Hellbot Magna Se Pro",
      "Marca": "Hellbot"
    },
    {
      "ID Equipo": "IDE3D0033",
      "ID Cliente": "IDCL3D0034",
      "Nombre Equipo": "Impesora 3D",
      "Modelo": "Ender 2",
      "Marca": "Creality"
    },
    {
      "ID Equipo": "IDE3D0034",
      "ID Cliente": "IDCL3D0034",
      "Nombre Equipo": "Impresora 3D",
      "Modelo": "Ender 3",
      "Marca": "Creality"
    },
    {
      "ID Equipo": "IDE3D0035",
      "ID Cliente": "IDCL3D0035",
      "Nombre Equipo": "Impresora 3D",
      "Modelo": "Ender 3 ve 3 KE",
      "Marca": "Creality"
    },
    {
      "ID Equipo": "IDE3D0036",
      "ID Cliente": "IDCL3D0036",
      "Nombre Equipo": "Impresora 3D Creality K2 Plus Combo",
      "Modelo": "K2 Plus Combo",
      "Marca": "Creality"
    },
    {
      "ID Equipo": "IDE3D0037",
      "ID Cliente": "IDCL3D0037",
      "Nombre Equipo": "Anycubic S1 Combo",
      "Modelo": "S1 Combo",
      "Marca": "Anycubic"
    },
    {
      "ID Equipo": "IDE3D0038",
      "ID Cliente": "IDCL3D0038",
      "Nombre Equipo": "Impresora 3D",
      "Modelo": "K1C",
      "Marca": "Creality"
    },
    {
      "ID Equipo": "IDE3D0039",
      "ID Cliente": "IDCL3D0040",
      "Nombre Equipo": "Impresora de resina",
      "Modelo": "Halot mage pro",
      "Marca": "Creality"
    },
    {
      "ID Equipo": "IDE3D0040",
      "ID Cliente": "IDCL3D0041",
      "Nombre Equipo": "Impresora 3D FDM Creality Ender 3 Pro",
      "Modelo": "Ender 3 Pro",
      "Marca": "Creality"
    },
    {
      "ID Equipo": "IDE3D0041",
      "ID Cliente": "IDCL3D0042",
      "Nombre Equipo": "Impresora 3D",
      "Modelo": "Genius pro",
      "Marca": "Artilleri"
    },
    {
      "ID Equipo": "IDE3D0042",
      "ID Cliente": "IDCL3D0043",
      "Nombre Equipo": "Impresora 3D FDM",
      "Modelo": "K1 Max",
      "Marca": "Creality"
    },
    {
      "ID Equipo": "IDE3D0043",
      "ID Cliente": "IDCL3D0043",
      "Nombre Equipo": "Impresora 3D FDM",
      "Modelo": "K2 Plus",
      "Marca": "Creality"
    },
    {
      "ID Equipo": "IDE3D0044",
      "ID Cliente": "IDCL3D0003",
      "Nombre Equipo": "Impresora 3D FDM Bambu Lab X1 Carbón",
      "Modelo": "X1 Carbón",
      "Marca": "Bambu Lab"
    },
    {
      "ID Equipo": "IDE3D0045",
      "ID Cliente": "IDCL3D0044",
      "Nombre Equipo": "Impresora 3D FDM Creality",
      "Modelo": "Ender 3S1"
    },
    {
      "ID Equipo": "IDE3D0046",
      "ID Cliente": "IDCL3D0003",
      "Nombre Equipo": "Bambu lab P1S",
      "Modelo": "P1S",
      "Marca": "Bambu lab"
    },
    {
      "ID Equipo": "IDE3D0047",
      "ID Cliente": "IDCL3D0003",
      "Nombre Equipo": "Impresora 3D Bambu Lab A1",
      "Modelo": "A1",
      "Marca": "Bambu Lab"
    },
    {
      "ID Equipo": "IDE3D0048",
      "ID Cliente": "IDCL3D0045",
      "Nombre Equipo": "Impresora 3D",
      "Modelo": "Ender 5 plus",
      "Marca": "Creality"
    },
    {
      "ID Equipo": "IDE3D0049",
      "ID Cliente": "IDCL3D0046",
      "Nombre Equipo": "Impresora 3D Fdm",
      "Modelo": "A1",
      "Marca": "Bambu lab"
    },
    {
      "ID Equipo": "IDE3D0050",
      "ID Cliente": "IDCL3D0047",
      "Nombre Equipo": "Impresora 3d",
      "Modelo": "Ender 3V 2",
      "Marca": "Creality"
    },
    {
      "ID Equipo": "IDE3D0051",
      "ID Cliente": "IDCL3D0048",
      "Nombre Equipo": "Impresora 3D FDM",
      "Modelo": "Ender 3 V3",
      "Marca": "Creality"
    },
    {
      "ID Equipo": "IDE3D0052",
      "ID Cliente": "IDCL3D0031",
      "Nombre Equipo": "Impresora 3D Creality Ender 3 V3",
      "Modelo": "Ender 3 V3",
      "Marca": "Creality"
    },
    {
      "ID Equipo": "IDE3D0053",
      "ID Cliente": "IDCL3D0049",
      "Nombre Equipo": "Impresora 3D",
      "Modelo": "Ender 3 V2",
      "Marca": "Creality"
    },
    {
      "ID Equipo": "IDE3D0054",
      "ID Cliente": "IDCL3D0050",
      "Nombre Equipo": "Impresora 3D",
      "Modelo": "Ender 3 V3 SE",
      "Marca": "Creality"
    },
    {
      "ID Equipo": "IDE3D0055",
      "ID Cliente": "IDCL3D0051",
      "Nombre Equipo": "Impresora 3D Bambu lab A1",
      "Modelo": "A1",
      "Marca": "Bambu lab"
    },
    {
      "ID Equipo": "IDE3D0056",
      "ID Cliente": "IDCL3D0052",
      "Nombre Equipo": "Impresora 3D",
      "Modelo": "HI COMBO",
      "Marca": "Creality"
    },
    {
      "ID Equipo": "IDE3D0057",
      "ID Cliente": "IDCL3D0053",
      "Nombre Equipo": "Impresora 3D FDM",
      "Modelo": "Anycubic",
      "Marca": "Kobra Neo"
    },
    {
      "ID Equipo": "IDE3D0058",
      "ID Cliente": "IDCL3D0054",
      "Nombre Equipo": "CNC",
      "Modelo": "Falcon A1 10W",
      "Marca": "Creality"
    },
    {
      "ID Equipo": "IDE3D0059",
      "ID Cliente": "IDCL3D0055",
      "Nombre Equipo": "Impresora 3D FDM",
      "Modelo": "SideWinder x2",
      "Marca": "Artillery"
    },
    {
      "ID Equipo": "IDE3D0060",
      "ID Cliente": "IDCL3D0039",
      "Nombre Equipo": "Equipo 2",
      "Modelo": "modelo 3",
      "Marca": "marca 3",
      "Serie": "123123"
    },
    {
      "ID Equipo": "IDE3D0061",
      "ID Cliente": "IDCL3D0056",
      "Nombre Equipo": "Impresora 3D",
      "Modelo": "X1 CARBON COMBO",
      "Marca": "Bambu Lab"
    },
    {
      "ID Equipo": "IDE3D0062",
      "ID Cliente": "IDCL3D0057",
      "Nombre Equipo": "Impresora 3D SLA",
      "Modelo": "Mars 4 ultra",
      "Marca": "ELEGOO"
    },
    {
      "ID Equipo": "IDE3D0063",
      "ID Cliente": "IDCL3D0058",
      "Nombre Equipo": "Impresora 3D",
      "Modelo": "A1 Combo",
      "Marca": "Bambu Lab"
    },
    {
      "ID Equipo": "IDE3D0064",
      "ID Cliente": "IDCL3D0036",
      "Nombre Equipo": "Impresora 3D FDM Bambu Lab X1 Carbón",
      "Modelo": "X1 Carbón",
      "Marca": "Bambu Lab X1"
    },
    {
      "ID Equipo": "IDE3D0065",
      "ID Cliente": "IDCL3D0059",
      "Nombre Equipo": "Impresora 3D Anycubic",
      "Modelo": "Photon Mono M7 Pro",
      "Marca": "Anycubic"
    },
    {
      "ID Equipo": "IDE3D0066",
      "ID Cliente": "IDCL3D0060",
      "Nombre Equipo": "IMPRESORA 3D",
      "Modelo": "X1 CARBON",
      "Marca": "Bambu lab"
    },
    {
      "ID Equipo": "IDE3D0067",
      "ID Cliente": "IDCL3D0061",
      "Nombre Equipo": "IMPRESORA 3D",
      "Modelo": "Kobra 2",
      "Marca": "Anycubic"
    },
    {
      "ID Equipo": "IDE3D0068",
      "ID Cliente": "IDCL3D0062",
      "Nombre Equipo": "Bambu Lab X1E",
      "Modelo": "X1E",
      "Marca": "Bambu Lab"
    },
    {
      "ID Equipo": "IDE3D0069",
      "ID Cliente": "IDCL3D0035",
      "Nombre Equipo": "Impresora 3D",
      "Modelo": "Ender 3 v3 SE",
      "Marca": "Creality"
    },
    {
      "ID Equipo": "IDE3D0070",
      "Modelo": "Bambu Lab P1S AMS",
      "Marca": "Bambu Lab"
    }
  ]
};
    
    let rootClientes3D = await prisma.parameter.findUnique({ where: { mnemonic: 'CLIENTES_3D' } });
    if (!rootClientes3D) rootClientes3D = await prisma.parameter.create({ data: { mnemonic: 'CLIENTES_3D', name: 'Clientes 3D SB', value: '3D' }});

    let rootEquipos3D = await prisma.parameter.findUnique({ where: { mnemonic: 'EQUIPOS_3D' } });
    if (!rootEquipos3D) rootEquipos3D = await prisma.parameter.create({ data: { mnemonic: 'EQUIPOS_3D', name: 'Equipos 3D SB', value: '3D' }});

    let rootServicios3D = await prisma.parameter.findUnique({ where: { mnemonic: 'INCIDENCIAS_3D' } });
    if (!rootServicios3D) rootServicios3D = await prisma.parameter.create({ data: { mnemonic: 'INCIDENCIAS_3D', name: 'Servicios 3D SB', value: '3D' }});

    let addedClients = 0;
    for (const c of data.clientes) {
      const idStr = c['ID Cliente'] || '';
      if (!idStr) continue;
      let name = c.Empresa ? c.Empresa : (c.Cedula || '') + ' ' + (c.Nombre || '') + ' ' + (c.Apellidos || '');
      name = name.trim();
      if (!name) continue;

      const existing = await prisma.parameter.findFirst({ where: { parentId: rootClientes3D.id, name } });
      if (!existing) {
        await prisma.parameter.create({
          data: {
            name,
            parentId: rootClientes3D.id,
            metadata: {
              cedula: c.Cedula,
              empresa: c.Empresa,
              nombres: c.Nombre,
              apellidos: c.Apellidos,
              correo: c.Correo,
              ciudad: c.Ciudad,
              telefono: c.Telefono,
              direccion: c.Direccion,
              idCliente: idStr
            }
          }
        });
        addedClients++;
      }
    }

    let addedEquipments = 0;
    for (const e of data.equipos) {
      const idEquipo = e['ID Equipo'];
      const idClienteExcel = e['ID Cliente'];
      if (!idEquipo) continue;
      
      let clientId = null;
      if (idClienteExcel) {
        const clients = await prisma.parameter.findMany({ where: { parentId: rootClientes3D.id } });
        const client = clients.find((cl: any) => cl.metadata && cl.metadata.idCliente === idClienteExcel);
        if (client) clientId = client.id;
      }

      const name = e.Modelo || e['Nombre Equipo'] || 'Equipo';
      const existing = await prisma.parameter.findFirst({ where: { parentId: rootEquipos3D.id, name } });
      if (!existing) {
        await prisma.parameter.create({
          data: {
            name,
            parentId: rootEquipos3D.id,
            metadata: {
              clientId: clientId,
              nombreEquipo: e['Nombre Equipo'],
              marca: e.Marca,
              modelo: e.Modelo,
              serie: e.Serie,
              idEquipo: idEquipo
            }
          }
        });
        addedEquipments++;
      }
    }

    const hardcodedServicios = [
      "VISITA TÉCNICA EN SITIO",
      "VISITA TÉCNICA EN LOCAL",
      "MANTENIMIENTO PREVENTIVO FDM",
      "MANTENIMIENTO PREVENTIVO SLA",
      "ENSAMBLADO",
      "DIAGNOSTICO",
      "IMPRESIÓN 3D",
      "ESCANEO 3D"
    ];
    let addedServicios = 0;
    for (const s of hardcodedServicios) {
      const existing = await prisma.parameter.findFirst({ where: { parentId: rootServicios3D.id, name: s } });
      if (!existing) {
        await prisma.parameter.create({ data: { name: s, parentId: rootServicios3D.id }});
        addedServicios++;
      }
    }

    
    let rootRepuestos3D = await prisma.parameter.findUnique({ where: { mnemonic: 'REPUESTOS_3D' } });
    if (!rootRepuestos3D) rootRepuestos3D = await prisma.parameter.create({ data: { mnemonic: 'REPUESTOS_3D', name: 'Repuestos 3D SB', value: '3D' }});

    let rootProveedores3D = await prisma.parameter.findUnique({ where: { mnemonic: 'PROVEEDORES_3D' } });
    if (!rootProveedores3D) rootProveedores3D = await prisma.parameter.create({ data: { mnemonic: 'PROVEEDORES_3D', name: 'Proveedores 3D SB', value: '3D' }});

    const repuestos = [
      "Boquilla 0.4mm Latón MK8",
      "Tubo PTFE Bowden 1m",
      "Correa GT2 6mm",
      "Polea GT2 20 dientes",
      "Rodamiento LM8UU",
      "Hotend Completo V6 24V",
      "Cartucho Calefactor 24V 40W",
      "Termistor NTC 100K",
      "Motor NEMA 17"
    ];
    for (const r of repuestos) {
      const existing = await prisma.parameter.findFirst({ where: { parentId: rootRepuestos3D.id, name: r } });
      if (!existing) await prisma.parameter.create({ data: { name: r, parentId: rootRepuestos3D.id }});
    }

    const proveedores = [
      "Empresa 1",
      "AMAZON",
      "Aliexpress",
      "COMPRA LOCAL",
      "HORUSTECH"
    ];
    for (const p of proveedores) {
      const existing = await prisma.parameter.findFirst({ where: { parentId: rootProveedores3D.id, name: p } });
      if (!existing) await prisma.parameter.create({ data: { name: p, parentId: rootProveedores3D.id }});
    }

    res.json({ success: true, message: `Added ${addedClients} clients, ${addedEquipments} equipments, ${addedServicios} services, repuestos and proveedores for 3D` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: (error as any).message, stack: (error as any).stack });
  }
});


httpServer.listen(PORT, () => {
  console.log(`\u2705 Backend Server running on port ${PORT} with WebSockets (Multi-Number Enabled)`);
});





















