# ðŸ—ºï¸ ROADMAP DE DESARROLLO: HORUSTECH CRM

## ðŸŸ¢ FASE 1: Base de Datos, Backend Base y Webhook de WhatsApp
- [ ] Inicializar proyecto Backend (Node.js/NestJS o FastAPI) y Frontend (Next.js).
- [ ] Configurar base de datos PostgreSQL con el schema Prisma (`DATABASE_SCHEMA.prisma`).
- [ ] Crear endpoint receptor de Webhooks para Meta WhatsApp Cloud API (validaciÃ³n de token y recepciÃ³n de payloads).
- [ ] Almacenamiento seguro de archivos multimedia (audios, imÃ¡genes, PDFs, STL) en servidor local o S3.

## ðŸŸ¡ FASE 2: Bandeja de Entrada Unificada en Tiempo Real (Chat UI)
- [ ] Interfaz de chat moderna tipo WhatsApp Web (Next.js + TailwindCSS + WebSockets).
- [ ] Reproductor de notas de voz interactivo y visor de imÃ¡genes/PDFs.
- [ ] Sistema de comentarios internos dentro del chat con menciones `@usuario`.
- [ ] BotÃ³n "Asignarme a mÃ­" (AutoasignaciÃ³n rÃ¡pida).

## ðŸŸ  FASE 3: Embudo de Ventas (Kanban Manual) y Seguimientos
- [ ] Tablero Kanban de ventas con drag-and-drop manual por los asesores.
- [ ] Selector rÃ¡pido de etapa en el panel lateral de la conversaciÃ³n.
- [ ] MÃ³dulo de recordatorios y alarmas con fecha/hora de contacto.
- [ ] MÃ³dulo de registro de Backorders (demanda no satisfecha para importaciones) y reportes en Excel/PDF.

## ðŸ”´ FASE 4: Motor de Enrutamiento Inteligente y Agentes de IA
- [ ] LÃ³gica de cartera activa (â‰¤90 dÃ­as) vs pools por canal.
- [ ] Agente de IA para pre-calificaciÃ³n y resumen en nota interna (sin mover etapas del embudo).
- [ ] Agente de IA para soporte tÃ©cnico RIS/PACS (ActualPACS / Horuspacs).
- [ ] Handover automÃ¡tico de IA a Humano al responder el asesor.