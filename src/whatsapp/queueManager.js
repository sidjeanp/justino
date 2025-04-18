// ./src/queueManager.js
const redis = require("redis");
const logger = require("../../utils/logger");

// Função para formatar a data e hora
function getFormattedDateTime() {
  const now = new Date();
  const date = now.toLocaleDateString("pt-BR"); // Formato de data: DD/MM/YYYY
  const time = now.toLocaleTimeString("pt-BR"); // Formato de hora: HH:MM:SS
  return `${date} ${time}`;
}

// Cria uma conexão com o Redis
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || "redis", // Host do Redis (padrão: 'redis')
    port: process.env.REDIS_PORT || 6379, // Porta do Redis (padrão: 6379)
  },
});

// Evento de erro no Redis
redisClient.on("error", (err) => {
  logger.error(`[${getFormattedDateTime()}] Erro no Redis:`, err.message);
});

// Evento de conexão bem-sucedida com o Redis
redisClient.on("connect", () => {
  logger.info(`[${getFormattedDateTime()}] Conexão estabelecida com o Redis!`);
});

// Função para adicionar uma mensagem à fila
async function addToQueue(message) {
  try {
    logger.info("Adicionando msg redis.");

    const queueName = "whatsapp-messages"; // Nome da fila no Redis
    await redisClient.connect(); // Garante que o cliente esteja conectado
    await redisClient.lPush(queueName, JSON.stringify(message)); // Adiciona a mensagem à fila
    logger.info(`Mensagem adicionada à fila:`, message);
  } catch (error) {
    logger.error(
      `[${getFormattedDateTime()}] Erro ao adicionar mensagem à fila:`,
      error.message
    );
  } finally {
    await redisClient.disconnect(); // Desconecta o cliente após a operação
  }
}

module.exports = { addToQueue };
