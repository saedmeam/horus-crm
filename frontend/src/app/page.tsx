'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import MainSidebar from '@/components/MainSidebar';
import { Toaster, toast } from 'react-hot-toast';
import { Send, Paperclip, Mic, UserPlus, Search, Info, Moon, Sun, X, Save, Settings, Bell, AlarmClock, Check, MessageSquare, Reply, FileText, UserCircle, ShoppingCart, Box, CheckCheck } from 'lucide-react';


// Make sure X and FileText are imported, they are on line 6.

function formatChatListDate(dateString: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - target.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Ayer';
  } else if (diffDays >= 2 && diffDays <= 6) {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()];
  } else {
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}

export default function CRMChatLayout() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [chatMode, setChatMode] = useState<'MESSAGE' | 'NOTE'>('MESSAGE');
  const [snippets, setSnippets] = useState<any[]>([]);
  const [metaTemplates, setMetaTemplates] = useState<any[]>([]);
  const [templateWizard, setTemplateWizard] = useState<any>(null);
  const [showSnippets, setShowSnippets] = useState(false);
  const [snippetFilter, setSnippetFilter] = useState('');
  const [pendingMedia, setPendingMedia] = useState<string | null>(null);
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentionList, setShowMentionList] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
    const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunksRef = require('react').useRef<Blob[]>([]);
  const recordingTimerRef = require('react').useRef<any>(null);

  const [reminders, setReminders] = useState<any[]>([]);
const [backorders, setBackorders] = useState<any[]>([]);
const [showBackorderModal, setShowBackorderModal] = useState(false);
const [boProductName, setBoProductName] = useState('');
const [boQuantity, setBoQuantity] = useState(1);
const [boNotes, setBoNotes] = useState('');
  const [activeAlert, setActiveAlert] = useState<any>(null);


  const [showNotifications, setShowNotifications] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderNotes, setReminderNotes] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const messagesEndRef = require('react').useRef<HTMLDivElement>(null);
  const chatScrollRef = require('react').useRef<HTMLDivElement>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  
  const scrollToBottom = (behavior: 'auto' | 'smooth' = 'auto') => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
      }
    }, 150);
  };
  
  require('react').useEffect(() => {
    // Solo scrollear cuando tenemos mensajes cargados
    if (messages && messages.length > 0) {
      scrollToBottom('auto');
    }
  }, [selectedChat, messages]);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const [darkMode, setDarkMode] = useState(false);

  
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('hello_world');
const [showInfo, setShowInfo] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactDireccion, setContactDireccion] = useState('');
  const [contactVendedor, setContactVendedor] = useState('');
  const [contactIdentificacion, setContactIdentificacion] = useState('');

  
  const handleAssignTo = async (userId: string | null) => {
    if (!selectedChat) return;
    try {
      const res = await fetch(`http://localhost:3001/api/conversations/${selectedChat.id}/assign`, {
        method: 'PUT',
        headers: { 
          'Authorization': 'Bearer ' + localStorage.getItem('token'),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ assignedUserId: userId })
      });
      if (res.ok) {
        setSelectedChat((prev: any) => ({ ...prev, assignedUserId: userId }));
        setConversations(prev => prev.map(c => c.id === selectedChat.id ? { ...c, assignedUserId: userId } : c));
        setShowAssignDropdown(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  

  useEffect(() => {
    const interval = setInterval(() => {
      if (reminders.length === 0) return;
      const now = new Date();
      const due = reminders.find(r => {
        if (r.isCompleted) return false;
        const rDate = new Date(r.scheduledFor);
        return rDate <= now && !localStorage.getItem('alerted_' + r.id);
      });
      
      if (due) {
        localStorage.setItem('alerted_' + due.id, 'true');
        setActiveAlert(due);
        
        // Reproducir sonido fuerte
        const audio = new Audio(localStorage.getItem('alarmSound') || '/sounds/reminder.mp3');
        audio.play().catch(e => console.log('Autoplay bloqueado:', e));
      }
    }, 5000); // Check every 5 seconds

  
    return (
) => clearInterval(interval);
  }, [reminders]);

  const fetchReminders = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/reminders`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
      .then(res => {
        if(res.status === 401 || res.status === 403) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            throw new Error('Auth error');
        }
        return res.json();
      })
      .then(data => setReminders(data))
      .catch(e => console.error(e));
  };

  const handleSaveReminder = async () => {
    if (!selectedChat?.contact?.id || !reminderDate || !reminderTime || !reminderNotes) return;
    try {
      const scheduledFor = new Date(`${reminderDate}T${reminderTime}`).toISOString();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/reminders`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: selectedChat.contact.id,
          scheduledFor,
          notes: reminderNotes
        })
      });
      if (res.ok) {
        setShowReminderModal(false);
        setReminderNotes('');
        setReminderDate('');
        setReminderTime('');
        fetchReminders();
        toast.success('Recordatorio guardado');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error guardando recordatorio');
    }
  };
    
    const handleSaveBackorder = async () => {
      if (!selectedChat || !boProductName) return;
      try {
        const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/backorders', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
          },
          body: JSON.stringify({
            contactId: selectedChat.contactId,
            productName: boProductName,
            quantity: boQuantity,
            notes: boNotes
          })
        });
        if (res.ok) {
          setShowBackorderModal(false);
          setBoProductName('');
          setBoQuantity(1);
          setBoNotes('');
          
          fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/contacts/' + selectedChat.contactId + '/backorders', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
            .then(res => {
        if(res.status === 401 || res.status === 403) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            throw new Error('Auth error');
        }
        return res.json();
      })
            .then(data => setBackorders(Array.isArray(data) ? data : []));
            
          toast.success('Pedido guardado correctamente');
        }
      } catch (e) {
        console.error(e);
        toast.error('Error guardando pedido');
      }
    };

  const handleCompleteReminder = async (id: string) => {
    try {
      await fetch(`http://localhost:3001/api/reminders/${id}/complete`, {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
      });
      fetchReminders();
    } catch (e) {
      console.error(e);
    }
  };

  const unreadChats = conversations.filter((c: any) => c._count?.messages > 0);

  const fetchConversations = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/settings`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
      .then(res => {
        if(res.status === 401 || res.status === 403) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            throw new Error('Auth error');
        }
        return res.json();
      })
      .then(data => setSnippets(data.snippets || []));

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/templates`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
      .then(res => {
        if(res.status === 401 || res.status === 403) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            throw new Error('Auth error');
        }
        return res.json();
      })
      .then(data => {
         if(Array.isArray(data)) setMetaTemplates(data.filter((t: any) => t.status === 'APPROVED' || t.status === 'LOCAL'));
      }).catch(e => console.error("Error fetching templates", e));

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/conversations`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
      .then(res => {
        if(res.status === 401 || res.status === 403) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            throw new Error('Auth error');
        }
        return res.json();
      })
      .then(data => setConversations(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData || '{}'));

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'denied' && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
    }

    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);
    fetchConversations();
      fetchReminders();
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users/agents`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } }).then(res => {
        if(res.status === 401 || res.status === 403) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            throw new Error('Auth error');
        }
        return res.json();
      }).then(data => setAgents(data));

    
    
      newSocket.on('new_reminder', (rem: any) => {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        if (rem.userId === u.id) {
          fetchReminders();
        }
      });

      newSocket.on('chat_assigned', (data: any) => {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      const isAdmin = u.role === 'SUPERADMIN' || u.role === 'ADMIN';
      
      // Siempre recargar la lista de la base de datos para que aplique reglas correctas
      fetchConversations();
      
      // Si soy admin, no me quites nunca el chat activo aunque otro se lo asigne
      if (!isAdmin && data.assignedUserId !== null && data.assignedUserId !== u.id) {
        setSelectedChat((prev: any) => prev?.id === data.conversationId ? null : prev);
      }
    });

    newSocket.on('message_status_update', (data: any) => {
        setMessages(prev => prev.map(msg => 
          (data.id && msg.id === data.id) || (data.metaMessageId && msg.metaMessageId === data.metaMessageId)
            ? { ...msg, status: data.status, metaMessageId: data.metaMessageId || msg.metaMessageId } 
            : msg
        ));
      });
      
      newSocket.on('new_message', (newMsg: any) => {
        if (newMsg.senderType === 'CLIENT') {
          try {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(e => console.log('Audio auto-play blocked', e));
          } catch(e) {}
        }
      // Filtrar mensajes que no pertenecen al usuario actual
      const ctx = newMsg.conversationContext;
      if (ctx) {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        const myLineIds = u?.lines?.map((l: any) => l.id) || [];
        
        const isMine = ctx.assignedUserId === u?.id;
        const isUnassignedButInMyLine = !ctx.assignedUserId && myLineIds.includes(ctx.whatsappLineId);
        const isLegacy = !ctx.assignedUserId && !ctx.whatsappLineId;
        
        if (!isMine && !isUnassignedButInMyLine && !isLegacy) {
          console.log('Ignorando mensaje, pertenece a otro agente o canal');
          return;
        }
      }
        if (newMsg.senderType === 'CLIENT' || newMsg.senderType === 'USER') {
          try {
            const audio = new Audio(localStorage.getItem('msgSound') || '/sounds/message.mp3');
            audio.play().catch(e => console.log('Autoplay bloqueado:', e));
            
            if (Notification.permission === 'granted') {
              const notif = new Notification('Horustech CRM', {
                body: newMsg.content?.substring(0, 50) || 'Tienes un nuevo mensaje.',
                icon: '/logo-icon.png'
              });
              notif.onclick = function() {
                window.focus();
                window.dispatchEvent(new CustomEvent('openChat', { detail: newMsg.conversationId }));
              };
            }
          } catch (err) {
            console.error('Error notificaciones:', err);
          }
        }

        setMessages(prev => {
          if (selectedChat && newMsg.conversationId === selectedChat.id) {
            // Mark as read immediately if chat is open
            if (newMsg.senderType === 'CLIENT') {
               fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/conversations/` + newMsg.conversationId + '/read', { 
                 method: 'PUT',
                 headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } 
               }).catch(e => {});
            }
            return [...prev, newMsg];
          }
          return prev;
        });

        setConversations(prev => {
          const idx = prev.findIndex(c => c.id === newMsg.conversationId);
          if (idx !== -1) {
            const updated = { ...prev[idx] };
            updated.messages = [newMsg]; // update last message
            if (newMsg.senderType === 'CLIENT') {
              updated._count = { ...updated._count, messages: (updated._count?.messages || 0) + 1 };
            }
            const arr = [...prev];
            arr.splice(idx, 1);
            return [updated, ...arr]; // move to top
          } else {
             // Let's just fetch all again if it's completely new
             fetchConversations();
             return prev;
          }
        });
      });

    return () => { newSocket.disconnect(); }
  }, [selectedChat]);

  useEffect(() => {
    const handleOpenChatEvent = (e: any) => {
      const chatToOpen = conversations.find(c => c.id === e.detail);
      if (chatToOpen) handleSelectChat(chatToOpen);
    };
    window.addEventListener('openChat', handleOpenChatEvent);
    return () => window.removeEventListener('openChat', handleOpenChatEvent);
  }, [conversations]);

  useEffect(() => {
    const handleOpenChatEvent = (e: any) => {
      const chatToOpen = conversations.find((c: any) => c.id === e.detail);
      if (chatToOpen) handleSelectChat(chatToOpen);
    };
    window.addEventListener('openChat', handleOpenChatEvent);
    return () => window.removeEventListener('openChat', handleOpenChatEvent);
  }, [conversations]);

  useEffect(() => {
    const handleOpenChatEvent = (e: any) => {
      const chatToOpen = conversations.find((c: any) => c.id === e.detail);
      if (chatToOpen) handleSelectChat(chatToOpen);
    };
    window.addEventListener('openChat', handleOpenChatEvent);
    return () => window.removeEventListener('openChat', handleOpenChatEvent);
  }, [conversations]);

  const handleSelectChat = (chat: any) => {
    setSelectedChat(chat);
    setContactName(chat?.contact?.name || chat?.contact?.phone);
    setContactEmail(chat?.contact?.email || '');
    const custom = chat?.contact?.customFields || {};
    setContactDireccion(custom.direccion || '');
    setContactVendedor(custom.vendedor || '');
    setContactIdentificacion(custom.identificacion || '');

    // Reset unread count locally
    setConversations(prev => prev.map(c => c.id === chat.id ? { ...c, _count: { ...c._count, messages: 0 } } : c));
    
    // Mark as read in backend
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/conversations/` + chat.id + '/read', { 
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } 
    }).catch(e => console.error(e));

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/conversations/` + chat.id + '/messages', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
      .then(res => {
        if(res.status === 401 || res.status === 403) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            throw new Error('Auth error');
        }
        return res.json();
      })
      .then(data => setMessages(data));
  };

    const handleInputChange = (e: any) => {
      const val = e.target.value;
      setInputText(val);

      if (val.startsWith('/')) {
        setShowSnippets(true);
        setSnippetFilter(val.substring(1).toLowerCase());
      } else {
        setShowSnippets(false);
      }

    

    if (chatMode === 'NOTE') {
      const parts = val.split(/\s+/);
      const lastWord = parts[parts.length - 1];
      if (lastWord.startsWith('@')) {
        setShowMentionList(true);
        setMentionSearch(lastWord.substring(1).toLowerCase());
      } else {
        setShowMentionList(false);
      }
    } else {
      setShowMentionList(false);
    }
  };

  
  const handleSendTemplate = async () => {
    if (!selectedChat) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/conversations/${selectedChat.id}/template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ templateName: selectedTemplate })
      });
      if (res.ok) {
        setShowTemplateModal(false);
      } else {
        toast.error('Error al enviar plantilla. Verifica que el nombre sea correcto en Facebook.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        clearInterval(recordingTimerRef.current);
        setRecordingTime(0);
        setIsRecording(false);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        stream.getTracks().forEach(track => track.stop());

        if (audioBlob.size > 0 && selectedChat) {
          const formData = new FormData();
          formData.append('file', audioBlob, 'voice_note.webm');
          const token = localStorage.getItem('token');
          
          try {
            const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/upload`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: formData
            });
            if (!uploadRes.ok) {
               if (uploadRes.status === 401 || uploadRes.status === 403) {
                  localStorage.removeItem('token');
                  window.location.href = '/login';
               }
               return;
            }
            const { url } = await uploadRes.json();
            
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/conversations/${selectedChat.id}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ content: '🎙️ Nota de voz', mediaUrl: url, mediaType: 'AUDIO' })
            });
          } catch(e) {
            console.error('Error enviando audio', e);
          }
        }
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error("No se pudo acceder al micrófono:", err);
      toast.error('Por favor permite el acceso al micrófono en tu navegador.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

const handleSelectMetaTemplate = (t: any) => {
    const varNames = JSON.parse(t.variables || '[]');
    if (varNames.length > 0) {
      setTemplateWizard({ template: t, step: 0, examples: Array(varNames.length).fill(''), varCount: varNames.length });
    } else {
      executeSendTemplate(t, []);
    }
    setShowSnippets(false);
  };

  const executeSendTemplate = async (template: any, examples: string[]) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/conversations/${selectedChat.id}/template`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token'),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateName: template.name,
          languageCode: template.language,
          variables: examples
        })
      });
      if (!res.ok) {
         if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return;
         }
         let d = {};
         try { d = await res.json(); } catch(e) {}
         toast.error('Error al enviar plantilla: ' + (d.error || 'Error de Meta'));
      } else {
         setInputText('');
      }
    } catch(e) {
       toast.error('Error de conexión');
    }
  };


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedChat) return;
    const tempMsg = inputText;
    setInputText('');
    setPendingMedia(null);

    let finalContent = tempMsg;
    if (replyingTo && chatMode === 'MESSAGE') {
      // Safe guard against missing content
      const safeContent = typeof replyingTo.content === 'string' ? replyingTo.content.substring(0, 60) : '';
      finalContent = `> ${safeContent}...\n\n${tempMsg}`;
      setReplyingTo(null);
    }

    if (chatMode === 'NOTE') {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/conversations/` + selectedChat.id + '/comments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
          },
          body: JSON.stringify({ content: tempMsg, mentions: [] }) // Notes don't need reply block
        });
      } catch (err) { console.error(err); }
      return;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/conversations/` + selectedChat.id + '/messages', {
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        method: 'POST',
        body: JSON.stringify({ 
            content: finalContent,
            mediaUrl: pendingMedia || null,
            mediaType: pendingMedia ? (
              pendingMedia.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? 'IMAGE' :
              pendingMedia.toLowerCase().match(/\.(mp3|wav|ogg|m4a)$/) ? 'AUDIO' :
              pendingMedia.toLowerCase().match(/\.(mp4|avi|mov)$/) ? 'VIDEO' :
              'DOCUMENT_PDF'
            ) : 'TEXT'
          })
      });
      if (!res.ok) {
        const errorData = await res.json();
        toast.error('Error enviando mensaje: ' + (errorData.error || 'Error desconocido'));
      }
  };

  const handleSaveContactInfo = async () => {
    if (!selectedChat) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/contacts/` + selectedChat?.contact?.id, {
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        method: 'PUT',
      body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          customFields: {
            direccion: contactDireccion,
            vendedor: contactVendedor,
            identificacion: contactIdentificacion
          }
        })
      });
      if (res.ok) {
        toast.success('Información de contacto guardada exitosamente');
        fetchConversations();
      } else {
        toast.error('Error al guardar contacto');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error de conexión');
    }
  };

  const getChannelBadge = (channel: string) => {
    if (!channel) return null;
    const label = channel.replace('WHATSAPP_', '').replace(/_/g, ' ');
    
    // Lista de paletas de colores vibrantes para los diferentes canales
    const colorPalettes = [
      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
      'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800',
      'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
      'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
      'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800',
      'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-800',
    ];

    // Simple hash function para asignar el mismo color siempre al mismo nombre de canal
    let hash = 0;
    for (let i = 0; i < channel.length; i++) {
      hash = channel.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colorPalettes.length;
    const color = colorPalettes[colorIndex];

    return <span className={"text-[9px] font-bold px-2 py-0.5 rounded-full border truncate max-w-[120px] inline-block " + color}>{label}</span>;
  };

  return (
    <div className={(darkMode ? 'dark' : '') + ' flex-1 flex flex-col min-h-0'}>
      <div className="flex flex-1 min-h-0 bg-gray-100 dark:bg-[#0b141a] overflow-hidden font-sans text-gray-800 dark:text-[#e9edef] transition-colors duration-200">
        <MainSidebar user={user} />
        
        <div className="w-1/3 max-w-[350px] min-w-[280px] bg-white dark:bg-[#111b21] border-r border-gray-200 dark:border-[#222d34] flex flex-col transition-colors duration-200">
          <div className="h-14 bg-gray-50 dark:bg-[#202c33] border-b border-gray-200 dark:border-[#222d34] flex items-center px-4 justify-between shrink-0 transition-colors duration-200">
            <div className="flex items-center gap-2">
              <img src="/logo-banner.png" alt="Horustech" className="h-8 object-contain" />
            </div>
            <div className="flex items-center gap-3">
                
                <div className="relative">
                  <button onClick={() => setShowNotifications(!showNotifications)} className="p-1.5 text-gray-500 dark:text-[#aebac1] hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a3942] rounded-full transition-colors relative">
                    <Bell className="w-5 h-5" />
                    {(unreadChats.length > 0 || reminders.length > 0) && (
                      <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#202c33]"></span>
                    )}
                  </button>
                  {showNotifications && (
                    <div className="absolute top-full left-0 sm:right-0 sm:left-auto mt-2 w-80 max-h-[80vh] overflow-y-auto bg-white dark:bg-[#1f2c33] border border-gray-200 dark:border-[#374248] rounded-xl shadow-2xl z-50 flex flex-col">
                      <div className="p-3 border-b border-gray-100 dark:border-[#2a3942] flex items-center justify-between sticky top-0 bg-white dark:bg-[#1f2c33] z-10">
                        <h3 className="font-bold text-gray-800 dark:text-gray-200">Notificaciones</h3>
                        <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white"><X className="w-4 h-4"/></button>
                      </div>
                      
                      <div className="p-2">
                        {/* Pedidos */}
                          {backorders.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider px-2 mb-2">Pedidos ({backorders.length})</h4>
                              {backorders.map(bo => (
                                <div key={bo.id} className="p-3 mb-1 bg-orange-50/50 dark:bg-[#202c33] hover:bg-orange-50 dark:hover:bg-[#2a3942] rounded-lg border border-orange-100 dark:border-[#2a3942] flex flex-col gap-1 transition-colors">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{bo.productName}</span>
                                    <span className="bg-orange-200 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300 text-xs px-2 py-0.5 rounded font-bold">x{bo.quantity}</span>
                                  </div>
                                  {bo.notes && <p className="text-xs text-gray-600 dark:text-[#8696a0] mt-1">{bo.notes}</p>}
                                  <span className="text-[10px] text-gray-400 mt-1">{new Date(bo.createdAt).toLocaleDateString()}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Recordatorios */}
                        {reminders.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-[10px] font-bold text-blue-600 dark:text-[#00a884] uppercase tracking-wider px-2 mb-2">Recordatorios</h4>
                            {reminders.map(rem => (
                              <div key={rem.id} className="p-3 mb-1 bg-blue-50/50 dark:bg-[#202c33] hover:bg-blue-50 dark:hover:bg-[#2a3942] rounded-lg border border-blue-100 dark:border-[#2a3942] group flex items-start gap-3 transition-colors">
                                <div className="mt-0.5"><AlarmClock className="w-4 h-4 text-blue-500 dark:text-[#00a884]" /></div>
                                <div className="flex-1">
                                  <span className="font-bold text-sm text-gray-800 dark:text-gray-200 block">{rem.contact?.name || rem.contact?.phone || 'Cliente'}</span>
                                  <span className="text-sm text-gray-600 dark:text-[#aebac1] block mt-0.5">{rem.notes}</span>
                                  <span className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 mt-1.5 block">{new Date(rem.scheduledFor).toLocaleString()}</span>
                                </div>
                                <button onClick={() => handleCompleteReminder(rem.id)} title="Marcar como completado" className="text-gray-300 hover:text-green-500 p-1.5 rounded-full hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors">
                                  <Check className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Mensajes sin leer */}
                        {unreadChats.length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-bold text-green-600 dark:text-[#00a884] uppercase tracking-wider px-2 mb-2">Nuevos Mensajes</h4>
                            {unreadChats.map((chat: any) => (
                              <div key={chat.id} onClick={() => { handleSelectChat(chat); setShowNotifications(false); }} className="p-3 mb-1 bg-green-50/50 dark:bg-[#202c33] hover:bg-green-50 dark:hover:bg-[#2a3942] rounded-lg border border-green-100 dark:border-[#2a3942] cursor-pointer transition-colors">
                                <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{chat.contact?.name || chat.contact?.phone}</div>
                                <div className="text-xs font-semibold text-green-600 dark:text-[#00a884] mt-1 flex items-center gap-1">
                                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                  {chat._count?.messages} mensaje{chat._count?.messages > 1 ? 's' : ''} sin leer
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {reminders.length === 0 && unreadChats.length === 0 && (
                          <div className="p-6 text-center text-gray-400 dark:text-[#8696a0] text-sm">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            Todo al día. No hay notificaciones.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                
                <button onClick={() => setDarkMode(!darkMode)} className="p-1.5 text-gray-500 dark:text-[#aebac1] hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a3942] rounded-full transition-colors">
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              <div 
                  className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:bg-blue-700 shadow-sm"
                  title="Cerrar Sesión"
                  onClick={() => {
                    if(confirm('¿Deseas cerrar sesión?')) {
                      localStorage.removeItem('token');
                      localStorage.removeItem('user');
                      window.location.href = '/login';
                    }
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
            </div>
          </div>

          <div className="p-3 border-b border-gray-100 dark:border-[#222d34] shrink-0 bg-white dark:bg-[#111b21] z-10 transition-colors duration-200">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400 dark:text-[#8696a0]" />
              <input 
                type="text" 
                placeholder="Buscar contacto o chat..." 
                className="w-full bg-gray-100 dark:bg-[#202c33] text-gray-800 dark:text-[#d1d7db] rounded-lg py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-[#00a884] transition-colors duration-200 placeholder-gray-400 dark:placeholder-[#8696a0]"
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="text-center text-gray-400 dark:text-[#8696a0] mt-10 text-sm">No hay conversaciones</p>
            ) : (
              (Array.isArray(conversations) ? conversations : []).map((chat) => (
                <div 
                  key={chat.id} 
                  onClick={() => handleSelectChat(chat)}
                  className={"flex items-center p-4 border-b border-gray-100 dark:border-[#222d34] cursor-pointer hover:bg-gray-50 dark:hover:bg-[#202c33] transition-colors " + (selectedChat?.id === chat.id ? 'bg-blue-50/50 dark:bg-[#2a3942]' : '')}
                >
                  <div className="w-9 h-9 bg-gray-200 dark:bg-[#374248] rounded-full flex-shrink-0 flex items-center justify-center text-gray-500 dark:text-[#d1d7db] font-bold text-xl">
                    {chat?.contact?.name ? chat?.contact?.name[0].toUpperCase() : '#'}
                  </div>
                  <div className="ml-3 flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h2 className="font-semibold text-gray-800 dark:text-[#e9edef] truncate pr-2">{chat?.contact?.name || chat?.contact?.phone}</h2>
                      <span className="text-xs text-gray-400 dark:text-[#8696a0] shrink-0">
                        {chat.messages[0] ? formatChatListDate(chat.messages[0].createdAt) : ''}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <p className="text-sm text-gray-500 dark:text-[#8696a0] truncate flex-1">
                          {chat.messages[0]?.content || 'Sin mensajes...'}
                        </p>
                        {chat._count?.messages > 0 && (
                          <div className="bg-[#00a884] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                            {chat._count.messages}
                          </div>
                        )}
                      <div className="shrink-0">
                        {getChannelBadge(chat.channel)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PANEL DERECHO (Area de Chat) */}
        <div className="flex-1 min-w-0 flex flex-col bg-[#efeae2] dark:bg-[#0b141a] transition-colors duration-200 relative overflow-hidden">
          
          {selectedChat ? (
            <>
              {/* Header Chat */}
              <div className="h-14 bg-white dark:bg-[#202c33] border-b border-gray-200 dark:border-[#222d34] flex items-center justify-between px-6 shadow-sm z-20 shrink-0 transition-colors duration-200">
                <div className="flex items-center cursor-pointer" onClick={() => setShowInfo(true)}>
                  <div className="w-9 h-9 bg-gray-200 dark:bg-[#374248] rounded-full flex items-center justify-center text-gray-600 dark:text-[#d1d7db] font-bold">
                    {selectedChat?.contact?.name ? selectedChat?.contact?.name[0].toUpperCase() : '#'}
                  </div>
                  <div className="ml-4">
                    <h2 className="font-bold text-gray-800 dark:text-[#e9edef] leading-tight hover:underline">{selectedChat?.contact?.name || selectedChat?.contact?.phone}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                      <span className="text-xs text-gray-500 dark:text-[#8696a0]">Linea:</span>
                      {getChannelBadge(selectedChat.channel)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <button onClick={() => setShowBackorderModal(true)} title="Crear Pedido para este cliente" className="p-1.5 text-gray-500 dark:text-[#aebac1] hover:text-orange-600 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-[#2a3942] rounded-full transition-colors"><ShoppingCart className="w-5 h-5" /></button>
                      <button 
                        onClick={() => setShowReminderModal(true)} 
                      title="Crear Recordatorio para este cliente"
                      className="p-1.5 text-gray-500 dark:text-[#aebac1] hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-[#2a3942] rounded-full transition-colors"
                    >
                      <AlarmClock className="w-5 h-5" />
                    </button>
                    <div className="relative">
    <button 
      onClick={() => {
        if (selectedChat?.assignedUserId) {
          handleAssignTo(null);
      } else {
        setShowAssignDropdown(!showAssignDropdown);
      }
    }} 
    className={"flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors shadow-sm " + 
    (selectedChat?.assignedUserId ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-red-100 hover:text-red-700 hover:border-red-200 dark:bg-green-900/40 dark:text-green-400 dark:border-green-800' : 'bg-blue-50 dark:bg-[#182229] text-blue-600 dark:text-[#00a884] border border-blue-200 dark:border-[#222d34] hover:bg-blue-100 dark:hover:bg-[#202c33]')}
  >
    <UserPlus className="w-4 h-4" />
    {selectedChat?.assignedUserId 
        ? (agents.find(a => a.id === selectedChat.assignedUserId)?.name || 'Asignado (Liberar)') 
        : 'Asignar'}
  </button>
  
  {showAssignDropdown && !selectedChat?.assignedUserId && (
    <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-[#1f2c33] border border-gray-200 dark:border-[#374248] rounded-lg shadow-lg z-50 overflow-hidden text-sm">
      <button 
        onClick={() => handleAssignTo(user?.id)}
        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#2a3942] text-blue-600 dark:text-[#00a884] font-semibold border-b border-gray-100 dark:border-[#2a3942]"
      >
        Asignarme a mí
      </button>
      {agents.filter(a => a.id !== user?.id).map(agent => (
        <button 
          key={agent.id}
          onClick={() => handleAssignTo(agent.id)}
          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#2a3942] text-gray-700 dark:text-gray-200 transition-colors"
        >
          {agent.name}
        </button>
      ))}
    </div>
  )}
</div>
                  <button onClick={() => setShowInfo(!showInfo)} className={"p-2 rounded-full transition-colors " + (showInfo ? 'bg-gray-200 dark:bg-[#374248] text-gray-700 dark:text-white' : 'text-gray-400 dark:text-[#aebac1] hover:text-gray-600 dark:hover:text-[#d1d7db] hover:bg-gray-100 dark:hover:bg-[#374248]')}>
                    <Info className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Chat Area - Fixed Background Opacity */}
              <div className="flex-1 relative flex flex-col overflow-hidden">
                <div 
                  className="absolute inset-0 pointer-events-none z-0" 
                  style={{ 
                    backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", 
                    backgroundSize: '400px', 
                    opacity: darkMode ? 0.05 : 0.4 
                  }}
                />
                <div 
  className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 relative z-10 flex flex-col"
  ref={chatScrollRef}
  onScroll={(e) => {
    const target = e.currentTarget;
    setShowScrollDown(target.scrollHeight - target.scrollTop - target.clientHeight > 150);
  }}
>
                    {messages.map((msg, idx) => {
                      if (msg.isInternal) {
                        return (
                          <div key={idx} className="flex justify-center my-2">
                            <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/50 rounded-xl px-4 py-2 max-w-[80%] shadow-sm">
                              <div className="flex items-center gap-1.5 mb-1">
                                <FileText className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-500" />
                                <span className="text-xs font-bold text-yellow-700 dark:text-yellow-500">Nota Interna - {msg.senderName || 'Sistema'}</span>
                              </div>
                              
{msg.mediaUrl && (
    <div className="mb-2 rounded-lg overflow-hidden border border-black/10 dark:border-white/10">
      {msg.mediaType === 'IMAGE' ? (
        <img src={msg.mediaUrl} alt="Imagen" className="max-w-full max-h-48 object-cover cursor-pointer" onClick={() => window.open(msg.mediaUrl, '_blank')} />
      ) : msg.mediaType === 'AUDIO' ? (
        <audio controls src={msg.mediaUrl} className="max-w-full" />
      ) : msg.mediaType === 'VIDEO' ? (
        <video controls src={msg.mediaUrl} className="max-w-full max-h-48 object-cover" />
      ) : (
        <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-[#2a3942] hover:bg-gray-100 transition-colors text-sm font-bold text-blue-600 dark:text-[#00a884]">
          <Paperclip className="w-4 h-4" /> Ver Archivo
        </a>
      )}
    </div>
  )}
<p className="text-sm font-medium leading-relaxed text-gray-800 dark:text-yellow-100/90">{msg.content}</p>

                              <span className="text-[10px] block text-right mt-1 text-yellow-600/70 dark:text-yellow-500/70">
                                {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      const isClient = msg.senderType === 'CLIENT';
                      return (
                        <div key={idx} className={"flex group items-center " + (isClient ? 'justify-start' : 'justify-end')}>
                          {!isClient && !msg.isInternal && (
                            <button onClick={() => setReplyingTo(msg)} className="opacity-0 group-hover:opacity-100 p-1.5 mx-1 text-gray-400 hover:text-blue-500 transition-opacity rounded-full hover:bg-gray-100 dark:hover:bg-[#2a3942]" title="Responder">
                              <Reply className="w-4 h-4" />
                            </button>
                          )}
                          <div className={"max-w-[70%] rounded-xl px-4 py-2 shadow-sm " + (
                            isClient 
                              ? 'bg-white dark:bg-[#202c33] rounded-tl-none' 
                              : 'bg-[#d9fdd3] dark:bg-[#005c4b] rounded-tr-none'
                          )}>
                            
{msg.mediaUrl && (
    <div className="mb-2 rounded-lg overflow-hidden border border-black/10 dark:border-white/10">
      {msg.mediaType === 'IMAGE' ? (
        <img src={msg.mediaUrl} alt="Imagen" className="max-w-full max-h-48 object-cover cursor-pointer" onClick={() => window.open(msg.mediaUrl, '_blank')} />
      ) : msg.mediaType === 'AUDIO' ? (
        <audio controls src={msg.mediaUrl} className="max-w-full" />
      ) : msg.mediaType === 'VIDEO' ? (
        <video controls src={msg.mediaUrl} className="max-w-full max-h-48 object-cover" />
      ) : (
        <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-[#2a3942] hover:bg-gray-100 transition-colors text-sm font-bold text-blue-600 dark:text-[#00a884]">
          <Paperclip className="w-4 h-4" /> Ver Archivo
        </a>
      )}
    </div>
  )}
<p className="text-sm font-medium leading-relaxed text-gray-900 dark:text-gray-100">{msg.content}</p>

                            <div className="flex justify-end items-center gap-1 mt-1">
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                  
                              {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            
                                </span>
                                {(!isClient && !msg.isInternal) && (
                                  <span className="text-[12px] flex items-center">
                                    {msg.status === 'READ' ? (
                                      <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                                    ) : msg.status === 'DELIVERED' ? (
                                      <CheckCheck className="w-3.5 h-3.5 text-gray-400" />
                                    ) : msg.status === 'SENT' ? (
                                      <Check className="w-3.5 h-3.5 text-gray-400" />
                                    ) : msg.status === 'FAILED' ? (
                                      <X className="w-3.5 h-3.5 text-red-500" title="Error" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5 text-gray-300" />
                                    )}
                                  </span>
                                )}
                              </div>
                          </div>
                          {isClient && !msg.isInternal && (
                            <button onClick={() => setReplyingTo(msg)} className="opacity-0 group-hover:opacity-100 p-1.5 mx-1 text-gray-400 hover:text-blue-500 transition-opacity rounded-full hover:bg-gray-100 dark:hover:bg-[#2a3942]" title="Responder">
                              <Reply className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                      })}
                      <div ref={messagesEndRef} className="h-1 shrink-0" />
                    </div>
                    {showScrollDown && (
                      <button
                        onClick={() => scrollToBottom('smooth')}
                        className="absolute bottom-24 right-4 p-3 bg-white dark:bg-[#202c33] text-gray-600 dark:text-gray-300 rounded-full shadow-lg border border-gray-200 dark:border-[#2a3942] z-50 hover:text-blue-500 transition-all"
                        title="Bajar al último mensaje"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                      </button>
                    )}
                </div>

              {/* Tabs & Input de Texto */}
                <div className={"flex flex-col border-t shrink-0 transition-colors duration-200 z-20 relative " + (chatMode === 'NOTE' ? 'bg-yellow-50 dark:bg-[#2a2718] border-yellow-200 dark:border-yellow-900' : 'bg-gray-100 dark:bg-[#202c33] border-gray-200 dark:border-[#222d34]')}>
                  
                  {/* Mode Tabs */}
                  <div className="flex items-center gap-1 px-4 pt-2">
                    <button 
                      onClick={() => setChatMode('MESSAGE')}
                      className={"px-4 py-1.5 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-1.5 " + (chatMode === 'MESSAGE' ? 'bg-white dark:bg-[#2a3942] text-blue-600 dark:text-[#00a884]' : 'text-gray-500 hover:text-gray-700 dark:text-[#aebac1] dark:hover:text-white')}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Mensaje de Cliente
                    </button>
                    <button 
                      onClick={() => setChatMode('NOTE')}
                      className={"px-4 py-1.5 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-1.5 " + (chatMode === 'NOTE' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400' : 'text-gray-500 hover:text-yellow-600 dark:text-[#aebac1] dark:hover:text-yellow-500')}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Nota Interna
                    </button>
                  </div>

                  {/* Mentions Dropdown */}
                  {showMentionList && agents.length > 0 && (
                    <div className="absolute bottom-full left-4 mb-2 bg-white dark:bg-[#202c33] border border-gray-100 dark:border-[#374248] rounded-xl shadow-2xl w-64 max-h-48 overflow-y-auto z-50">
                      {agents.filter(a => a.name.toLowerCase().includes(mentionSearch)).map(agent => (
                        <div 
                          key={agent.id} 
                          onClick={() => {
                            const parts = inputText.split(/\s+/);
                            parts.pop(); // remove partial
                            setInputText((parts.length > 0 ? parts.join(' ') + ' ' : '') + '@' + agent.name + ' ');
                            setShowMentionList(false);
                          }}
                          className="p-3 hover:bg-gray-50 dark:hover:bg-[#2a3942] cursor-pointer text-sm text-gray-800 dark:text-gray-200 border-b border-gray-50 dark:border-[#2a3942] last:border-0 flex items-center gap-2"
                        >
                          <UserCircle className="w-5 h-5 text-gray-400" />
                          <span className="font-semibold">{agent.name}</span>
                          <span className="text-xs text-gray-400">({agent.role})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-3 flex items-center gap-3">
                    {chatMode === 'MESSAGE' && (
                      <label className="p-2 text-gray-500 dark:text-[#8696a0] hover:text-gray-700 dark:hover:text-[#d1d7db] transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-[#374248] cursor-pointer">
  <Paperclip className="w-5 h-5" />
  <input type="file" className="hidden" onChange={async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/upload', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        body: formData
      });
      if (res.ok) {
        let data = { url: '' }; try { data = await res.json(); } catch(e) {}
        setPendingMedia(data.url);
      } else {
        let err = { error: 'Upload failed' }; try { err = await res.json(); } catch(e) {}
        toast.error('Error: ' + err.error);
      }
    } catch (e) {
      toast.error('Fallo de red al subir el archivo');
    }
  }} />
</label>
                    )}
                    
                                        {/* Reply Preview */}
                    {replyingTo && chatMode === 'MESSAGE' && (
                      <div className="absolute bottom-full left-12 right-12 mb-2 bg-white dark:bg-[#202c33] border-l-4 border-blue-500 shadow-md p-2 rounded-r-lg flex justify-between items-center z-50">
                        <div className="truncate flex-1">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block truncate">
                            Respondiendo a: {replyingTo.senderType === 'CLIENT' ? 'Cliente' : (replyingTo.senderName || 'Tú')}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-[#aebac1] truncate block">
                            {replyingTo.content}
                          </span>
                        </div>
                        <button onClick={() => setReplyingTo(null)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    {pendingMedia && (
  <div className="absolute bottom-20 left-4 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-2 z-20">
    📎 Archivo adjunto (se enviará con el mensaje)
    <button type="button" onClick={() => setPendingMedia(null)} className="text-blue-500 hover:text-red-500 ml-2">x</button>
  </div>
)}


  <>
      {templateWizard && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#202c33] rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-[#2a3942]">
              <h3 className="font-bold text-gray-800 dark:text-white">Enviar Plantilla Meta: {templateWizard.template.name}</h3>
              <p className="text-sm text-gray-500">Paso {templateWizard.step + 1} de {templateWizard.varCount}</p>
            </div>
            <div className="p-6">
                <p className="text-sm font-bold text-yellow-600 mb-2">Llena la variable</p>
                <input 
                  autoFocus
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-[#111b21] dark:text-white"
                  placeholder="Valor para el cliente"
                  value={templateWizard.examples[templateWizard.step] || ''}
                  onChange={e => {
                    const newEx = [...templateWizard.examples];
                    newEx[templateWizard.step] = e.target.value;
                    setTemplateWizard({...templateWizard, examples: newEx});
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                        if (templateWizard.step < templateWizard.varCount - 1) {
                          setTemplateWizard({...templateWizard, step: templateWizard.step + 1});
                        } else {
                          executeSendTemplate(templateWizard.template, templateWizard.examples);
                          setTemplateWizard(null);
                        }
                    }
                  }}
                />
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-[#2a3942] flex justify-end gap-2">
                <button onClick={() => setTemplateWizard(null)} className="px-4 py-2 text-gray-500">Cancelar</button>
                <button 
                  onClick={() => {
                    if (templateWizard.step < templateWizard.varCount - 1) {
                        setTemplateWizard({...templateWizard, step: templateWizard.step + 1});
                    } else {
                        executeSendTemplate(templateWizard.template, templateWizard.examples);
                        setTemplateWizard(null);
                    }
                  }} 
                  className="px-4 py-2 bg-[#00a884] text-white rounded-lg font-medium"
                >
                  {templateWizard.step < templateWizard.varCount - 1 ? 'Siguiente' : 'Enviar Plantilla'}
                </button>
            </div>
          </div>
        </div>
      )}

      {showSnippets && chatMode === 'MESSAGE' && (
        <div className="absolute bottom-20 left-4 bg-white dark:bg-[#202c33] border border-gray-200 dark:border-[#2a3942] rounded-xl shadow-lg w-80 max-h-80 overflow-y-auto z-20">
          
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 text-xs font-bold text-blue-700 dark:text-blue-300 flex justify-between">
            <span>Plantillas Oficiales de Meta</span>
          </div>
          {metaTemplates.filter((t: any) => t.name.includes(snippetFilter)).map((t: any) => (
            <div 
              key={'meta-'+t.id} 
              onClick={() => handleSelectMetaTemplate(t)}
              className="p-3 hover:bg-gray-50 dark:hover:bg-[#2a3942] cursor-pointer border-b border-gray-50 dark:border-[#2a3942] flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-600 dark:text-blue-400 text-sm font-mono">/{t.name}</span>
                <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 rounded">{t.category}</span>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-300 truncate">{t.bodyText}</span>
            </div>
          ))}

          <div className="p-2 bg-gray-50 dark:bg-[#111b21] border-y border-gray-100 dark:border-[#2a3942] text-xs font-bold text-gray-500">
            Respuestas Rapidas (Snippets)
          </div>
          {snippets.filter((s: any) => s.shortcut.includes(snippetFilter)).map((snippet: any) => (
            <div 
              key={snippet.id} 
              onClick={() => {
                setInputText(snippet.text || '');
                if (snippet.mediaUrl) setPendingMedia(snippet.mediaUrl);
                setShowSnippets(false);
              }}
              className="p-3 hover:bg-gray-50 dark:hover:bg-[#2a3942] cursor-pointer border-b border-gray-50 dark:border-[#2a3942] last:border-0 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#00a884] text-sm font-mono">/{snippet.shortcut}</span>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-300 truncate">{snippet.text}</span>
            </div>
          ))}

          {snippets.filter((s: any) => s.shortcut.includes(snippetFilter)).length === 0 && metaTemplates.filter((t: any) => t.name.includes(snippetFilter)).length === 0 && (
            <div className="p-4 text-center text-xs text-gray-400">No se encontraron atajos</div>
          )}
        </div>
      )}
  </>

  <button 
    type="button"
    onClick={() => setShowTemplateModal(true)}
    title="Enviar Plantilla (Romper 24h)" 
    className="p-3 text-white rounded-full shadow-md transition-colors bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 mr-2"
  >
    <FileText size={20} />
  </button>
  <form onSubmit={handleSendMessage} className="flex-1 flex relative">
                      <input 
                        type="text" 
                        value={inputText}
                        onChange={handleInputChange}
                        placeholder={chatMode === 'MESSAGE' ? "Escribe un mensaje..." : "Escribe una nota interna oculta para el cliente (usa @ para mencionar)..."} 
                        className={"flex-1 rounded-lg px-3 py-2 text-sm outline-none border shadow-sm transition-all " + (
                          chatMode === 'MESSAGE' 
                            ? "bg-white dark:bg-[#2a3942] text-gray-800 dark:text-[#d1d7db] border-transparent focus:border-gray-300 dark:focus:border-[#374248] placeholder-gray-400 dark:placeholder-[#8696a0]"
                            : "bg-white dark:bg-[#1a1811] text-yellow-900 dark:text-yellow-100 border-yellow-300 dark:border-yellow-700 focus:border-yellow-500 placeholder-yellow-500/70 dark:placeholder-yellow-700"
                        )}
                      />
                    </form>
    
                    {inputText.trim() ? (
                      <button onClick={handleSendMessage} className={"p-3 text-white rounded-full shadow-md transition-colors " + (chatMode === 'MESSAGE' ? 'bg-blue-600 dark:bg-[#00a884] hover:bg-blue-700 dark:hover:bg-[#008f6f] dark:text-[#111b21]' : 'bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-500')}>
                        {chatMode === 'MESSAGE' ? <Send className="w-5 h-5 ml-1" /> : <Save className="w-5 h-5" />}
                      </button>
                    ) : (
                      <button className={"p-3 text-white rounded-full shadow-md transition-colors " + (chatMode === 'MESSAGE' ? 'bg-gray-500 dark:bg-[#2a3942] dark:text-[#aebac1]' : 'bg-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-700/50')}>
                        {chatMode === 'MESSAGE' ? <Send className="w-5 h-5 ml-1" /> : <Save className="w-5 h-5" />}
                      </button>
                    )}
                  </div>
                </div>
              </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] dark:bg-[#222e35] border-b-[6px] border-[#25D366] dark:border-[#00a884] z-10">
              <div className="text-center px-6">
                <div className="w-32 h-32 mx-auto mb-4 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-sm">
                  <img src="/logo-icon.png" alt="Horustech Icon" className="w-full h-full object-cover dark:brightness-110" />
                </div>
                <h2 className="text-2xl font-light text-[#41525d] dark:text-[#e9edef] mb-2">Horustech CRM para Windows</h2>
                <p className="text-[#8696a0] dark:text-[#8696a0] text-sm max-w-lg mx-auto leading-relaxed">
                  Envia y recibe mensajes sin mantener tu telefono conectado.<br/>
                  Utiliza Horustech CRM en hasta 4 dispositivos vinculados y 1 telefono a la vez.
                </p>
                <div className="mt-12 text-xs flex justify-center items-center text-[#8696a0]">
                  <span className="mr-1">??</span> Cifrado de extremo a extremo simulado
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PANEL TERCERO: INFO DEL CONTACTO */}
        {showInfo && selectedChat && (
          <div className="w-80 bg-white dark:bg-[#111b21] border-l border-gray-200 dark:border-[#222d34] flex flex-col transition-colors duration-200 z-30">
            <div className="h-14 flex items-center px-4 border-b border-gray-200 dark:border-[#222d34] shrink-0 justify-between">
              <h2 className="font-bold text-gray-800 dark:text-[#e9edef]">Info del contacto</h2>
              <button onClick={() => setShowInfo(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-[#202c33]">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-2xl mb-2">
                  {contactName ? contactName[0].toUpperCase() : '#'}
                </div>
                <input 
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="text-center font-bold text-xl text-gray-800 dark:text-white bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 focus:border-blue-500 outline-none w-full pb-1"
                />
                <p className="text-gray-500 dark:text-[#8696a0] mt-1">{selectedChat?.contact?.phone}</p>
              </div>

              <hr className="border-gray-200 dark:border-[#222d34]" />

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-800 dark:text-[#e9edef] uppercase tracking-wider">Contact Fields</h3>
                
                <div>
                  <label className="text-xs text-gray-500 dark:text-[#8696a0] font-semibold mb-1 block">Direccion</label>
                  <input type="text" value={contactDireccion} onChange={(e) => setContactDireccion(e.target.value)} placeholder="Anadir direccion" className="w-full bg-gray-50 dark:bg-[#202c33] border border-gray-200 dark:border-[#222d34] rounded px-3 py-1.5 text-sm outline-none focus:border-blue-400 text-gray-800 dark:text-gray-200" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-[#8696a0] font-semibold mb-1 block">Email Address</label>
                  <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Anadir email" className="w-full bg-gray-50 dark:bg-[#202c33] border border-gray-200 dark:border-[#222d34] rounded px-3 py-1.5 text-sm outline-none focus:border-blue-400 text-gray-800 dark:text-gray-200" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-[#8696a0] font-semibold mb-1 block">Vendedor Asignado</label>
                  <select value={contactVendedor} onChange={(e) => setContactVendedor(e.target.value)} className="w-full bg-gray-50 dark:bg-[#202c33] border border-gray-200 dark:border-[#222d34] rounded px-3 py-1.5 text-sm outline-none focus:border-blue-400 text-gray-800 dark:text-gray-200">
                    <option value="">Seleccionar vendedor...</option>
                    <option value="santiago">Santiago</option>
                    <option value="sofia">Sofia</option>
                    <option value="mario">Mario</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-[#8696a0] font-semibold mb-1 block">Identificacion (RUC/CI)</label>
                  <input type="text" value={contactIdentificacion} onChange={(e) => setContactIdentificacion(e.target.value)} placeholder="Anadir identificacion" className="w-full bg-gray-50 dark:bg-[#202c33] border border-gray-200 dark:border-[#222d34] rounded px-3 py-1.5 text-sm outline-none focus:border-blue-400 text-gray-800 dark:text-gray-200" />
                </div>
              </div>

              <button onClick={handleSaveContactInfo} className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition-colors">
                <Save className="w-4 h-4" />
                Guardar Cambios
              </button>

            </div>
          </div>
        )}

      

      
      {/* Alerta Activa de Recordatorio */}
      {activeAlert && (
        <div className="fixed top-6 right-6 bg-white dark:bg-[#1f2c33] border-l-4 border-orange-500 rounded-xl shadow-2xl z-[200] w-80 overflow-hidden animate-bounce">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-2 text-orange-600 dark:text-orange-400">
              <AlarmClock className="w-6 h-6 animate-pulse" />
              <h3 className="font-bold text-lg">¡Recordatorio!</h3>
            </div>
            <p className="font-bold text-gray-800 dark:text-gray-100">{activeAlert.contact?.name || activeAlert.contact?.phone}</p>
            <p className="text-sm text-gray-600 dark:text-[#aebac1] mt-1 line-clamp-3">{activeAlert.notes}</p>
            
            <div className="mt-4 flex gap-2">
              <button 
                onClick={() => {
                  const chat = conversations.find((c: any) => c.contactId === activeAlert.contactId);
                  if (chat) {
                    handleSelectChat(chat);
                  }
                  setActiveAlert(null);
                }} 
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-1.5 rounded-lg font-bold text-sm transition-colors"
              >
                Abrir Chat
              </button>
              <button 
                onClick={() => {
                  handleCompleteReminder(activeAlert.id);
                  setActiveAlert(null);
                }} 
                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-[#2a3942] dark:hover:bg-[#374248] text-gray-700 dark:text-gray-200 py-1.5 rounded-lg font-bold text-sm transition-colors"
              >
                Completar
              </button>
              <button 
                onClick={() => setActiveAlert(null)} 
                className="px-3 bg-gray-100 hover:bg-gray-200 dark:bg-[#2a3942] dark:hover:bg-[#374248] text-gray-700 dark:text-gray-200 rounded-lg transition-colors flex items-center justify-center"
                title="Cerrar alerta"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      

      {/* Modal Pedido */}
        {showBackorderModal && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm transition-all">
            <div className="bg-white dark:bg-[#1f2c33] w-full max-w-md rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-[#2a3942]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  Registrar Pedido
                </h3>
                <button onClick={() => setShowBackorderModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-[#8696a0] uppercase tracking-wider mb-1">Producto / Servicio</label>
                  <input type="text" value={boProductName} onChange={e => setBoProductName(e.target.value)} className="w-full border border-gray-200 dark:border-[#2a3942] bg-gray-50 dark:bg-[#111b21] dark:text-[#d1d7db] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all" placeholder="Ej: Licencia Anual CRM" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-[#8696a0] uppercase tracking-wider mb-1">Cantidad</label>
                  <input type="number" min="1" value={boQuantity} onChange={e => setBoQuantity(parseInt(e.target.value) || 1)} className="w-full border border-gray-200 dark:border-[#2a3942] bg-gray-50 dark:bg-[#111b21] dark:text-[#d1d7db] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-[#8696a0] uppercase tracking-wider mb-1">Notas / Detalles</label>
                  <textarea value={boNotes} onChange={e => setBoNotes(e.target.value)} className="w-full border border-gray-200 dark:border-[#2a3942] bg-gray-50 dark:bg-[#111b21] dark:text-[#d1d7db] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all resize-none h-24" placeholder="Observaciones del pedido..."></textarea>
                </div>
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <button onClick={() => setShowBackorderModal(false)} className="px-5 py-2.5 rounded-xl font-semibold text-gray-600 dark:text-[#aebac1] hover:bg-gray-100 dark:hover:bg-[#2a3942] transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSaveBackorder} disabled={!boProductName} className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-semibold transition-colors shadow-md flex items-center gap-2">
                  Guardar Pedido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Recordatorio */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm transition-all">
          <div className="bg-white dark:bg-[#1f2c33] w-full max-w-md rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-[#2a3942]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <AlarmClock className="w-5 h-5 text-blue-600 dark:text-[#00a884]" />
                Nuevo Recordatorio
              </h3>
              <button onClick={() => setShowReminderModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-[#8696a0] mb-6">Se agregará un recordatorio para el contacto: <strong className="text-gray-700 dark:text-gray-300">{selectedChat?.contact?.name || selectedChat?.contact?.phone || 'Usuario'}</strong></p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-[#aebac1] mb-1.5">Descripción / Notas</label>
                <textarea 
                  value={reminderNotes} 
                  onChange={(e) => setReminderNotes(e.target.value)}
                  className="w-full border border-gray-300 dark:border-[#374248] bg-gray-50 dark:bg-[#111b21] rounded-xl p-3 text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500 dark:focus:border-[#00a884] min-h-[100px] resize-none transition-colors"
                  placeholder="Ej: Llamar para confirmar pago, enviar propuesta..."
                ></textarea>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-[#aebac1] mb-1.5">Fecha</label>
                  <input 
                    type="date" 
                    value={reminderDate} 
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full border border-gray-300 dark:border-[#374248] bg-gray-50 dark:bg-[#111b21] rounded-xl p-3 text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500 dark:focus:border-[#00a884] transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-[#aebac1] mb-1.5">Hora</label>
                  <input 
                    type="time" 
                    value={reminderTime} 
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full border border-gray-300 dark:border-[#374248] bg-gray-50 dark:bg-[#111b21] rounded-xl p-3 text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500 dark:focus:border-[#00a884] transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setShowReminderModal(false)} className="px-5 py-2.5 rounded-xl text-gray-600 dark:text-[#aebac1] hover:bg-gray-100 dark:hover:bg-[#2a3942] font-semibold transition-colors">
                Cancelar
              </button>
              <button onClick={handleSaveReminder} disabled={!reminderNotes || !reminderDate || !reminderTime} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:bg-[#00a884] dark:hover:bg-[#008f6f] dark:disabled:bg-[#00a884]/50 text-white font-semibold transition-colors shadow-md flex items-center gap-2">
                Guardar Recordatorio
              </button>
            </div>
          </div>
        </div>
      )}
      
      </div>
    
      {/* MODAL DE PLANTILLAS */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <FileText size={18} className="text-green-600" /> 
                Enviar Plantilla (Meta)
              </h3>
              <button onClick={() => setShowTemplateModal(false)} className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Usa plantillas pre-aprobadas para iniciar chats o responder después de 24 horas.
              </p>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre de la Plantilla</label>
                <input 
                  type="text" 
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                  placeholder="ej: seguimiento_cotizacion"
                />
              </div>
              <div className="pt-2">
                <button 
                  onClick={handleSendTemplate}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Send size={18} /> Enviar Plantilla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}