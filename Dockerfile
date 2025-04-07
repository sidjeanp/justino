# Dockerfile
FROM node:18-alpine

# Instala o PM2 globalmente
RUN npm install -g pm2

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos necessários
COPY package*.json ./
RUN npm install --production

# Instala o cliente MySQL
RUN apk add --no-cache mysql-client

# Copia o código-fonte
COPY . .

# Expõe a porta do servidor
EXPOSE 3000

# Comando para iniciar o servidor
#CMD ["node", "src/app.js"]
# Comando para iniciar a aplicação
#CMD ["node", "index.js"]
# Inicia o PM2 com a configuração
CMD ["pm2-runtime", "ecosystem.config.js"]
