// ./test.js
// Este arquivo coordena os testes de comunicação com os serviços MongoDB, Redis, MySQL e WhatsApp.
// Ele também chama os testes internos de cada classe para verificar se estão funcionando corretamente.

const mongoose = require('mongoose');
const Redis = require('ioredis');
const mysql = require('mysql2/promise');
const { useMultiFileAuthState, makeWASocket } = require('@whiskeysockets/baileys');
const testMongoDBModel = require('./src/models/Conversation'); // Teste do modelo MongoDB
const testQueue = require('./src/queue'); // Teste da fila Redis/Bull
const testChatGPT = require('./src/chatgpt'); // Teste da integração com ChatGPT

async function testMongoDB() {
    console.log('Testando conexão ao MongoDB...');
    try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('Conexão ao MongoDB bem-sucedida!');
        await testMongoDBModel.test(); // Chama o teste interno do modelo MongoDB
    } catch (error) {
        console.error('Erro ao conectar ao MongoDB:', error.message);
    }
}

async function testRedis() {
    console.log('Testando conexão ao Redis...');
    const redis = new Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT, 10),
    });
    try {
        await redis.ping();
        console.log('Conexão ao Redis bem-sucedida!');
        await testQueue.test(); // Chama o teste interno da fila Redis/Bull
    } catch (error) {
        console.error('Erro ao conectar ao Redis:', error.message);
    } finally {
        redis.disconnect();
    }
}

async function testMySQL() {
    console.log('Testando conexão ao MySQL...');
    try {
        // Aguarda 5 segundos para garantir que o MySQL esteja pronto
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            port: parseInt(process.env.MYSQL_PORT, 10),
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
        });
        console.log('Conexão ao MySQL bem-sucedida!');
        await connection.end();
    } catch (error) {
        console.error('Erro ao conectar ao MySQL:', error.message);
    }
}

async function testWhatsApp() {
    console.log('Testando conexão ao WhatsApp...');
    try {
        const { state } = await useMultiFileAuthState('auth_info_baileys');
        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: true,
        });
        sock.ev.on('connection.update', async (update) => {
            const { connection, qr } = update;
            if (qr) {
                console.log('QR Code recebido. Escaneie o código no seu celular.');
            }
            if (connection === 'open') {
                console.log('Conexão ao WhatsApp bem-sucedida!');
                sock.logout(); // Encerra a conexão após o teste
            }
        });
    } catch (error) {
        console.error('Erro ao conectar ao WhatsApp:', error.message);
    }
}

(async () => {
    await testMongoDB();
    await testRedis();
    await testMySQL();
    await testWhatsApp();
    await testChatGPT.test(); // Chama o teste interno da integração com ChatGPT
})();