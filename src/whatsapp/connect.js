// ./src/whatsapp/connect.js

const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeWASocket } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const { addToQueue } = require('./queueManager');
const { saveGroupToDatabase, saveParticipantToDatabase } = require('../database/db'); // Importa funções para salvar no banco de dados

// Variável global para armazenar a instância do socket
let sock;

// ID do grupo específico (substitua pelo ID real)
const TARGET_GROUP_ID = '1234567890-123456789@g.us';

// Função para formatar data e hora
function getFormattedDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString('pt-BR');
    const time = now.toLocaleTimeString('pt-BR');
    return `${date} ${time}`;
}

// Variável de controle para reconexões
let isReconnecting = false;

// Função para processar mensagens
async function processMessage(msg) {
    try {
        const remoteJid = msg.key.remoteJid;
        const sender = msg.key.participant || remoteJid;
        const senderName = msg.pushName || sender.split('@')[0];

        if (remoteJid.endsWith('@g.us')) {
            try {
                // Obtém os metadados do grupo
                const groupMetadata = await sock.groupMetadata(remoteJid);
                const groupName = groupMetadata.subject;
                const groupCode = remoteJid.split('@')[0];
                console.log(`[${getFormattedDateTime()}] Grupo: ${groupName} (Código: ${groupCode})`);
                console.log(`[${getFormattedDateTime()}] Enviada por: ${senderName}`);

                // Salva o grupo no banco de dados
                await saveGroupToDatabase({
                    group_id: remoteJid,
                    name: groupName,
                    allow_ai_interaction: true, // Define se a IA pode interagir com o grupo
                    summary: `Grupo identificado como ${groupName}.`
                });

                // Salva o participante no banco de dados
                await saveParticipantToDatabase({
                    participant_id: sender,
                    name: senderName,
                    allow_ai_interaction: true, // Define se a IA pode interagir com o participante
                    group_id: remoteJid
                });
            } catch (error) {
                console.warn(`[${getFormattedDateTime()}] Não foi possível obter metadados do grupo:`, error.message);
            }
        } else {
            console.log(`[${getFormattedDateTime()}] Mensagem recebida em conversa individual: ${remoteJid} | ${senderName}`);
        }

        let messageText = '';
        if (msg.message?.conversation) {
            messageText = msg.message.conversation;
        } else if (msg.message?.extendedTextMessage?.text) {
            messageText = msg.message.extendedTextMessage.text;
        } else if (msg.message?.imageMessage?.caption) {
            messageText = msg.message.imageMessage.caption;
        } else {
            messageText = 'Mensagem não suportada';
        }

        console.log(`[${getFormattedDateTime()}] Conteúdo: ${messageText}`);
    } catch (error) {
        console.error(`[${getFormattedDateTime()}] Erro ao processar mensagem:`, error.message);
    }
}

// Função principal para conectar ao WhatsApp
async function connectToWhatsApp(authFolder) {
    // Aguarda 10 segundos para garantir que os bancos estão prontos
    await new Promise(resolve => setTimeout(resolve, 10000));

    if (isReconnecting) {
        console.log(`[${getFormattedDateTime()}] Já está reconectando. Aguardando...`);
        return;
    }

    console.log(`[${getFormattedDateTime()}] Tentando conectar ao WhatsApp...`);
    isReconnecting = true;

    try {
        const { state, saveCreds } = await useMultiFileAuthState(authFolder);
        const { version } = await fetchLatestBaileysVersion();

        sock = makeWASocket({
            logger: pino({ level: 'silent' }),
            printQRInTerminal: true,
            auth: state,
            version,
        });

        sock.ev.on('connection.update', async (update) => {
            const { connection, qr, lastDisconnect } = update;

            if (qr) {
                console.log(`[${getFormattedDateTime()}] QR Code recebido. Escaneie-o no seu celular:`);
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                isReconnecting = false;
                const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
                console.error(`[${getFormattedDateTime()}] Conexão fechada:`, lastDisconnect.error?.message || 'Motivo desconhecido');
                if (shouldReconnect) {
                    setTimeout(() => connectToWhatsApp(authFolder), 5000);
                }
            } else if (connection === 'open') {
                isReconnecting = false;
                console.log(`[${getFormattedDateTime()}] Conectado ao WhatsApp!`);
            }
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0];
            if (msg.key.remoteJid && !msg.key.fromMe) {
                processMessage(msg); // Processa a mensagem recebida
                await addToQueue(msg); // Adiciona a mensagem à fila do Redis
            }
        });
    } catch (error) {
        isReconnecting = false;
        console.error(`[${getFormattedDateTime()}] Erro ao conectar:`, error.message);
        setTimeout(() => connectToWhatsApp(authFolder), 10000);
    }
}

// Função para manter o processo ativo
async function keepAlive() {
    while (true) {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

// Obter a pasta de autenticação dos argumentos
const [authFolder] = process.argv.slice(2);
if (!authFolder) {
    console.error('Erro: Pasta de autenticação não fornecida.');
    process.exit(1);
}

// Iniciar o bot e manter o processo ativo
connectToWhatsApp(authFolder);
keepAlive();

// Exportar a função para uso em outros módulos
module.exports = { connectToWhatsApp };