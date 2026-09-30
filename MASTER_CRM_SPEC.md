# ðŸ“˜ ESPECIFICACIÃ“N MAESTRA Y ARQUITECTURA: HORUSTECH CONVERSATIONAL CRM

## 1. VISIÃ“N GENERAL Y CONTEXTO DE NEGOCIO
**Horustech** es una empresa de tecnologÃ­a mÃ©dica y odontolÃ³gica en Ecuador con dos lÃ­neas principales de negocio:
1. **LÃ­nea 3D & OdontologÃ­a Digital:** Venta de impresoras 3D, resinas especializadas, escÃ¡neres 3D, filamentos, servicio de diseÃ±o y modelado 3D (archivos .STL) y soporte tÃ©cnico.
2. **Software MÃ©dico & ImagenologÃ­a (Horuspacs / ActualPACS):** Almacenamiento DICOM en la nube, visores web/mÃ³viles para radiÃ³logos y clÃ­nicas, generaciÃ³n de informes radiolÃ³gicos estructurados y soporte tÃ©cnico RIS/PACS.

### Lecciones aprendidas y limitaciones superadas (Bitrix24 / Hyros / Respond.io):
- **Soporte Multimedia Nativo:** Necesidad crÃ­tica de enviar, recibir y reproducir notas de voz de WhatsApp sin trabas, ademÃ¡s de imÃ¡genes, PDFs y archivos 3D (.STL).
- **Control de Seguimientos con Fecha:** Evitar pÃ©rdidas de ventas por olvido de llamadas o cotizaciones pactadas (ej. fechas de aprobaciÃ³n de crÃ©ditos).
- **Registro de Backorders (Demanda No Satisfecha):** Capturar quÃ© productos solicitaron los clientes y no se vendieron por falta de inventario, para optimizar las importaciones y compras de stock de gerencia.
- **Flujo Fluido tipo WhatsApp:** El asesor no debe salir del chat para gestionar el cliente o mover etapas del embudo.

---

## 2. ARQUITECTURA DEL SISTEMA

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                 CANALES (Meta WhatsApp Cloud API)           â”‚
â”‚   â€¢ WhatsApp Ventas 1    â€¢ WhatsApp Ventas 2    â€¢ Redes/Web â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                               â”‚ (Webhooks en tiempo real)
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    BACKEND (Node.js / FastAPI)              â”‚
â”‚  â€¢ Receptor Webhooks      â€¢ Motor Reglas (90 dÃ­as Cartera)  â”‚
â”‚  â€¢ WebSocket Server       â€¢ Motor Agentes IA (Pre-atenciÃ³n) â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
               â”‚                              â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚     BASE DE DATOS (PostgreSQL)â”‚â”‚       FRONTEND (Next.js)     â”‚
â”‚  â€¢ Contactos & Cartera      â”‚â”‚  â€¢ Bandeja Chat en Vivo      â”‚
â”‚  â€¢ Mensajes & Archivos      â”‚â”‚  â€¢ Embudo Kanban Manual      â”‚
â”‚  â€¢ Recordatorios & Tareas   â”‚â”‚  â€¢ MÃ³dulo Backorders         â”‚
â”‚  â€¢ Backorders & Reportes    â”‚â”‚  â€¢ SupervisiÃ³n en Tiempo Realâ”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## 3. LOS 5 MÃ“DULOS DEL SISTEMA

### MÃ³dulo 1: Bandeja de Entrada Unificada & Chat en Vivo
- ConexiÃ³n oficial vÃ­a Meta WhatsApp Cloud API.
- RecepciÃ³n y envÃ­o en tiempo real vÃ­a WebSockets de:
  - Mensajes de texto y emojis.
  - **Notas de voz (.ogg/.mp3/.m4a) con reproductor interactivo.**
  - ImÃ¡genes, documentos PDF y archivos 3D (.STL / .OBJ / DICOM).
- SupervisiÃ³n en vivo para directores y gerencia (lectura en tiempo real).
- Comentarios internos privados dentro del chat con `@menciones` a asesores.

### MÃ³dulo 2: Motor de Enrutamiento y Cartera (Regla de 90 DÃ­as)
- **Cartera Activa (Ãšltima interacciÃ³n â‰¤ 90 dÃ­as):**
  - Si el cliente tiene un `assigned_user_id` vÃ¡lido y activo (Sofia `1179198`, Mario `1179200` o Edgar `1179201`), se asigna directamente a Ã©l.
- **Cartera Expirada (> 90 dÃ­as), Lead Nuevo o Sin Vendedor VÃ¡lido:**
  - **NO se autoasigna.** La conversaciÃ³n queda libre y dispara una notificaciÃ³n/comentario interno al equipo correspondiente:
    - **WhatsApp Ventas 1:** Pool de Sofia y Mario (el primero en responder o pulsar "Asignarme a mÃ­" gana el lead).
    - **WhatsApp Ventas 2:** Edgar.
    - **Redes Sociales (FB, IG, TikTok, Web):** Pool general de los 3 (Sofia, Mario y Edgar).
    - **LÃ­neas Especializadas:** DiseÃ±o 3D (Wladimir AlbÃ¡n `1191443`) | Soporte 3D (Ronaldo Santos `1191363`) | Soporte RISPACS (Bandeja tÃ©cnica aislada).

### MÃ³dulo 3: Embudo de Ventas Visual (Pipeline Kanban 100% Manual por los Asesores)
- âš ï¸ **REGLA DE NEGOCIO CLAVE:** El movimiento de etapas en el embudo es **TOTALMENTE MANUAL por parte de los asesores de ventas**. La IA NO mueve etapas automÃ¡ticamente por el momento.
- Columnas de Etapa:
  1. `NUEVO_LEAD` (Contacto inicial)
  2. `EN_NEGOCIACION` (CotizaciÃ³n enviada / En seguimiento)
  3. `VENTA_GANADA` (Vendido / Facturado)
  4. `VENTA_PERDIDA` (No interesado / Descartado)
- El asesor cambia la etapa fÃ¡cilmente:
  - Arrastrando la tarjeta en el tablero Kanban (Drag & Drop).
  - O seleccionando la etapa desde el selector rÃ¡pido en la barra lateral del chat.

### MÃ³dulo 4: Sistema de Recordatorios y Alarmas de Seguimiento
- BotÃ³n en chat: **"Programar Seguimiento"**.
- Campos: Fecha, Hora, Nota de seguimiento.
- Alerta visual y sonora en el CRM el dÃ­a y hora configurados.
- Panel diario de "Mis Tareas / Seguimientos del DÃ­a" para cada vendedor.

### MÃ³dulo 5: Registro de Backorders (Demanda No Satisfecha para Importaciones)
- BotÃ³n en chat: **"Registrar Producto No Disponible"**.
- Campos: Producto/Insumo, CategorÃ­a (Resina, Filamento, Repuesto, Equipo), Cantidad solicitada, Color/EspecificaciÃ³n, Notas.
- Reporte mensual para Gerencia: Muestra la demanda insatisfecha por producto para planificar importaciones con datos reales de los clientes.

---

## 4. INTEGRACIÃ“N DE AGENTES DE IA (ALCANCE ACTUAL)
1. **Agente de Pre-calificaciÃ³n de Ventas:**
   - Saluda, recopila datos iniciales (requerimiento, ciudad/clÃ­nica, archivo STL, urgencia).
   - Publica el resumen en comentario interno y activa las menciones al equipo.
   - Se pausa automÃ¡ticamente en cuanto un asesor humano interviene.
   - **Nota:** La IA NO clasifica ni mueve las etapas del embudo automÃ¡ticamente; esto queda a criterio y gestiÃ³n del vendedor.
2. **Agente de Soporte RIS/PACS:**
   - Asistente de nivel 1 con base de conocimiento tÃ©cnica (Horuspacs / visores DICOM).
   - Nunca cierra la conversaciÃ³n sin confirmaciÃ³n del usuario.
   - Deriva al tÃ©cnico humano en caso de requerir soporte avanzado.