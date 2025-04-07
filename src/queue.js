// ./src/queue.js
// Este arquivo configura a fila Redis usando o pacote Bull para processamento assíncrono de mensagens.
// Ele também inclui um método de teste para verificar se a fila está funcionando corretamente.

const { Queue } = require('bullmq');
const Redis = require('ioredis');

// Configuração do Redis
const redisConnection = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10),
});

// Cria a fila 'messageQueue'
const messageQueue = new Queue('messageQueue', { connection: redisConnection });

// Método de teste para verificar o funcionamento da fila
messageQueue.test = async function () {
    console.log('Executando teste da fila Redis/Bull...');
    try {
        await this.add('test-job', { message: 'Teste de fila' });
        console.log('Job adicionado à fila com sucesso.');
    } catch (error) {
        console.error('Erro ao testar a fila Redis/Bull:', error.message);
    }
};

module.exports = messageQueue;