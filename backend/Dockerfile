FROM node:20

WORKDIR /app

# Instalar dependencias (reproducible con lockfile)
COPY package*.json ./
RUN npm install

# Copiar el esquema de Prisma y generar el cliente
COPY prisma ./prisma/
RUN npx prisma generate

# Copiar el resto del código
COPY . .

EXPOSE 3001

# Comando para iniciar el backend
CMD ["npm", "start"]
