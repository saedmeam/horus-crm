# Scripts de una sola vez (importacion / seed)

Estos scripts NO son parte de la aplicacion en ejecucion. Son de un solo uso para importar datos iniciales del Helpdesk.

## prisma/seed.ts (seed principal)
- Se ejecuta automaticamente en el arranque de Docker (`npm run seed`).
- Crea los roles (SUPERADMIN, ADMIN) y el usuario administrador.

## seed-catalogs.js
- Importa catalogos del Helpdesk (clientes, equipos, tipos de incidencia, tipos de tarea) desde un Excel.
- Requiere el archivo `C:/Users/horustech/Downloads/Menu.xlsx`.
- Uso: `node backend/scripts/seed-catalogs.js`

## generate_seed.js
- Genera `import_excel.ts` a partir del Excel (el resultado ya esta en import_excel.ts).
- Requiere el archivo `C:/Users/horustech/Downloads/Menu.xlsx`.
- Uso: `node backend/scripts/generate_seed.js`

## import_excel.ts
- Script de importacion (ya generado) con datos de clientes/equipos.
- Uso: `npx ts-node backend/scripts/import_excel.ts`

## seed_data.json
- Datos de seed (JSON).