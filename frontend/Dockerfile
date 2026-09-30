FROM node:20-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el código fuente
COPY . .

# Construir la aplicación Next.js para producción
RUN npm run build

# Exponer el puerto
EXPOSE 3000

# Ejecutar el frontend
CMD ["npm", "start"]
