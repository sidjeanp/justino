// ./src/whatsapp/queueConsumer.js
const { createClient } = require('redis');
const pino = require('pino');
const { sendMessage } = require('./connect');
const { getAIResponse } = require('../ai/aiManager'); // Importa o gerenciador de IA
//const { generateResponse } = require('../chatgpt'); // Importa a função do ChatGPT

// Função para formatar a data e hora
function getFormattedDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString('pt-BR'); // Formato de data: DD/MM/YYYY
    const time = now.toLocaleTimeString('pt-BR'); // Formato de hora: HH:MM:SS
    return `${date} ${time}`;
}

// Cria uma instância do cliente Redis
const redisClient = createClient({
    socket: {
        host: process.env.REDIS_HOST || 'redis', // Host do Redis (padrão: 'redis')
        port: process.env.REDIS_PORT || 6379,   // Porta do Redis (padrão: 6379)
    },
});

// Conecta ao Redis
(async () => {
    try {
        await redisClient.connect();
        console.log(`[${getFormattedDateTime()}] Consumidor conectado ao Redis!`);
    } catch (error) {
        console.error(`[${getFormattedDateTime()}] Erro ao conectar ao Redis:`, error.message);
    }
})();

// Evento de erro no Redis
redisClient.on('error', (err) => {
    console.error(`[${getFormattedDateTime()}] Erro no Redis:`, err.message);
});

// Função para processar mensagens da fila
async function processQueue() {
    try {
        while (true) {
            // Remove a primeira mensagem da fila
            const message = await redisClient.lPop('whatsapp-messages');
            if (!message) {
                // Se a fila estiver vazia, aguarda antes de verificar novamente
                await new Promise((resolve) => setTimeout(resolve, 5000)); // Aguarda 5 segundos
                continue;
            }

            // Processa a mensagem
            const parsedMessage = JSON.parse(message);
            console.log(`[${getFormattedDateTime()}] Mensagem processada:`, parsedMessage);

             // Gera uma resposta usando o gerenciador de IA
            const sender = parsedMessage.key.remoteJid;
            const content = parsedMessage.message?.conversation || parsedMessage.message?.imageMessage?.caption || 'Mensagem não suportada';
            const response = await getAIResponse(content);

            // Envia a resposta via WhatsApp
            sendMessage(sender, response);
        }
    } catch (error) {
        console.error(`[${getFormattedDateTime()}] Erro ao processar fila:`, error.message);
    }
}

// Inicia o consumidor
processQueue();