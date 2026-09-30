import express from 'express';
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

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const prisma = new PrismaClient();

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

// --- Admin / User Management Routes ---

// Listar todos los usuarios (Solo SUPERADMIN o ADMIN)
app.get('/api/users', authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'SUPERADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'No tienes permisos para ver usuarios' });
    }
    const users = await prisma.user.findMany({
      select: { id: true, username: true, name: true, email: true, role: true, active: true, createdAt: true, lines: true }
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
    const { name, username, email, password, role, lineIds } = req.body;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name,
        username,
        email,
        passwordHash,
        role: role || 'SALES',
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
    const { name, phoneNumberId } = req.body;
    const newLine = await prisma.whatsAppLine.create({
      data: { name, phoneNumberId, active: true }
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
// Actualizar Usuario (Editar)
app.put('/api/users/:id', authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'SUPERADMIN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'No tienes permisos' });
    }
    const { name, username, email, password, role, lineIds } = req.body;
    
    let updateData: any = {
      name,
      username,
      email,
      role,
      lines: {
        set: lineIds ? lineIds.map((id: string) => ({ id })) : []
      }
    };

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
      include: { lines: true }
    });
    
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Credenciales inválidas o usuario inactivo' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        lines: user.lines
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error en el login' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { lines: true }
    });
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

io.on('connection', (socket) => {
  console.log('Frontend conectado:', socket.id);
});

// --- FASE 2: ENDPOINTS PARA LA INTERFAZ DEL CRM ---


app.put('/api/conversations/:id/assign', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { assignedUserId } = req.body;
    
    // Si assignedUserId es undefined, asumimos que es "asignarme a mi" por defecto (retrocompatibilidad)
    const targetUserId = assignedUserId !== undefined ? assignedUserId : req.user.id;
    
    const conversation = await prisma.conversation.update({
      where: { id },
      data: { assignedUserId: targetUserId } // Puede ser un ID o null para liberar
    });
    
    io.emit('chat_assigned', { conversationId: id, assignedUserId: targetUserId });
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Error asignando chat' });
  }
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

app.get('/api/conversations', authenticateToken, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { lines: true }
    });
    
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const lineIds = user.lines.map((l: any) => l.id);

    // Regla de visibilidad:
    // 1. Si está asignado a mí, lo veo (assignedUserId == myId)
    // 2. Si NO está asignado a nadie, y pertenece a una de MIS líneas, lo veo.
    // 3. Si NO está asignado a nadie, y es un chat legacy (whatsappLineId nulo), lo veo temporalmente para no perder historial.
    
      const isAdmin = user.role === 'SUPERADMIN' || user.role === 'ADMIN';
      const whereClause = isAdmin ? {} : {
        OR: [
          { assignedUserId: user.id },
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
      include: { contact: true }
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

    io.emit('new_message', { ...savedMessage, conversationContext: conversation });

    const token = process.env.WHATSAPP_TOKEN;
    let phoneNumberId = process.env.DEFAULT_PHONE_NUMBER_ID || '';

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
      } catch (err) {
        console.error('Error al enviar a Meta:', err);
      }
    }

    res.json(savedMessage);
  } catch (error) {
    res.status(500).json({ error: 'Error sending message' });
  }
});


// --- FASE 1 & MULTI-NUMBER: ENDPOINTS DEL WEBHOOK DE META ---

app.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook/whatsapp', async (req, res) => {
  try {
    const body = req.body;
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
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
            const contactObj = change.value.contacts[0];
            
            const phone = contactObj.wa_id;
            const name = contactObj.profile.name;
            
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

            if (mediaIdToDownload && process.env.WHATSAPP_TOKEN) {
              try {
                // 1. Obtener la URL del media
                const mediaMetaRes = await fetch("https://graph.facebook.com/v19.0/" + mediaIdToDownload, {
                  headers: { 'Authorization': "Bearer " + process.env.WHATSAPP_TOKEN }
                });
                const mediaMeta = await mediaMetaRes.json();
                
                if (mediaMeta.url) {
                  // 2. Descargar el archivo binario
                  const fileRes = await fetch(mediaMeta.url, {
                    headers: { 'Authorization': "Bearer " + process.env.WHATSAPP_TOKEN }
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
              where: { contactId: contact.id },
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

            const savedMessage = await prisma.message.create({
              data: {
                conversationId: conversation.id,
                senderType: 'CLIENT',
                content: text,
                mediaType: mediaType,
                mediaUrl: mediaUrl,
                metaMessageId: messageId,
                status: 'RECEIVED'
              }
            });

            io.emit('new_message', { ...savedMessage, conversationContext: conversation });
          }
        }
      }
    }
    res.sendStatus(200);
  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.sendStatus(500);
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



// --- PEDIDOS (BACKORDERS) ---
app.post('/api/backorders', authenticateToken, async (req: any, res: any) => {
  try {
    const { contactId, productName, category, quantity, specification, notes } = req.body;
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
      include: { contact: true }
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



// --- SYSTEM SETTINGS (JSON FILE) ---
const settingsFile = process.env.SETTINGS_PATH || require('path').join(__dirname, '..', 'settings.json');


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
  res.json(await getSettings());
});

app.put('/api/settings', authenticateToken, async (req: any, res: any) => {
  const { customContactFields, pipelineStages, snippets } = req.body;
  const current = await getSettings();
  if (customContactFields !== undefined) current.customContactFields = customContactFields;
  if (pipelineStages !== undefined) current.pipelineStages = pipelineStages;
  if (snippets !== undefined) current.snippets = snippets;
  
  await saveSettings(current);
  res.json(current);
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\u2705 Backend Server running on port ${PORT} with WebSockets (Multi-Number Enabled)`);
});





















