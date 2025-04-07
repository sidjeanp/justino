// ./src/consumer.js
const redis = require('redis');
const { getFormattedDateTime } = require('./utils/helpers');

// Cria uma conexão com o Redis
const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'redis',
    port: process.env.REDIS_PORT || 6379,
});

redisClient.on('error', (err) => {
    console.error(`[${getFormattedDateTime()}] Erro no Redis:`, err);
});

redisClient.on('connect', () => {
    console.log(`[${getFormattedDateTime()}] Consumidor conectado ao Redis!`);
});

// Função para consumir mensagens da fila
async function consumeMessages() {
    const queueName = 'whatsapp-messages';
    while (true) {
        try {
            const message = await redisClient.rPop(queueName);
            if (message) {
                console.log(`[${getFormattedDateTime()}] Mensagem consumida da fila:`, message);
                // Processar a mensagem aqui (ex.: salvar no MongoDB, chamar API externa, etc.)
            } else {
                await new Promise((resolve) => setTimeout(resolve, 1000)); // Espera 1 segundo se a fila estiver vazia
            }
        } catch (error) {
            console.error(`[${getFormattedDateTime()}] Erro ao consumir mensagem:`, error.message);
        }
    }
}

consumeMessages();