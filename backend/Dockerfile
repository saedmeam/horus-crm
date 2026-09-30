FROM node:20-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el código fuente
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Exponer el puerto
EXPOSE 3001

# Ejecutar el backend asegurando que la base de datos se sincronice
CMD ["sh", "-c", "npx prisma db push && npx ts-node src/index.ts"]
