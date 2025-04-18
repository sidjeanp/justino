// ./src/whatsapp/connect.js

const logger = require('../../utils/logger'); // Importa o logger
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeWASocket } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const { addToQueue } = require('./queueManager');
const { saveGroupToDatabase, saveParticipantToDatabase, associateParticipantToGroup, saveTranscriptionToDatabase } = require('../database/db'); // Importa funções para salvar no banco de dados
const ContactGroupService = require('../services/ContactGroupService');

// Variável global para armazenar a instância do socket
let sock;

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
                logger.info(`Grupo: ${groupName} (Código: ${groupCode})`);
                logger.info(`Enviada por: ${senderName}`);

                // Salva o grupo no banco de dados
                await saveGroupToDatabase({
                    group_id: remoteJid,
                    name: groupName,
                    allow_ai_interaction: true, // Define se a IA pode interagir com o grupo
                    summary: `Grupo identificado como ${groupName}.`,
                });

                let participant = {
                                    customer_id: sender,
                                    participant_id: sender,
                                    name: senderName,
                                    allow_ai_interaction: true, // Define se a IA pode interagir com o participante
                                   // group_id: remoteJid,
                                };
                   
                // Salva o participante no banco de dados
                await saveParticipantToDatabase(participant);

                // Associa o participante ao grupo
                await associateParticipantToGroup(sender, remoteJid);

            } catch (error) {
                logger.warn(`Não foi possível obter metadados do grupo: ${error.message}`);
            }
        } else {
            logger.info(`Mensagem recebida em conversa individual: ${remoteJid} | ${senderName}`);
            
            let participant = {
                                customer_id: sender,
                                participant_id: sender,
                                name: senderName,
                                allow_ai_interaction: true,
                            };

            // Salva o usuário no banco de dados (se ainda não existir)
            await saveParticipantToDatabase(participant);
        }

        // Processa o conteúdo da mensagem
        await processMessageContent(msg);
    } catch (error) {
        logger.error(`Erro ao processar mensagem: ${error.message}`);
    }
}

// Função para processar o conteúdo da mensagem
async function processMessageContent(msg) {
    let messageText = '';

    if (msg.message?.conversation) {
        messageText = msg.message.conversation;
    } else if (msg.message?.extendedTextMessage?.text) {
        messageText = msg.message.extendedTextMessage.text;
    } else if (msg.message?.imageMessage?.caption) {
        messageText = msg.message.imageMessage.caption;
    } else if (msg.message?.audioMessage) {
        // Trata mensagens de áudio
        await handleAudioMessage(msg);
        return; // Sai após tratar o áudio
    } else {
        messageText = 'Mensagem não suportada';
    }

    logger.info(`Conteúdo: ${messageText}`);
}

// Função para tratar mensagens de áudio
async function handleAudioMessage(msg) {
    const audioMessage = msg.message.audioMessage;
    const sender = msg.key.participant || msg.key.remoteJid;

    logger.info(`Áudio recebido de: ${sender}`);

    // Encaminha o áudio para "Zapia Brasil"
    const zapiaBrasilJid = '5511987654321@s.whatsapp.net'; // Substitua pelo JID real de "Zapia Brasil"

    try {
        // Encaminha o áudio
        await sock.sendMessage(zapiaBrasilJid, {
            forwardedFrom: msg.key.remoteJid,
            audio: audioMessage.url, // URL do áudio (ou use o buffer diretamente)
            mimetype: audioMessage.mimetype,
            fileName: 'audio-transcricao',
        });

        logger.info(`Áudio encaminhado para Zapia Brasil.`);
    } catch (error) {
        logger.error(`Erro ao encaminhar áudio para Zapia Brasil: ${error.message}`);
    }
}

// Função para processar a resposta de transcrição de "Zapia Brasil"
async function handleTranscriptionResponse(msg) {
    const remoteJid = msg.key.remoteJid;

    // Verifica se a mensagem é de "Zapia Brasil"
    const isFromZapiaBrasil = remoteJid === '5511987654321@s.whatsapp.net'; // Substitua pelo JID real
    if (!isFromZapiaBrasil) return;

    const transcription = msg.message?.conversation;
    if (!transcription) {
        logger.warn(`Resposta de transcrição inválida recebida de Zapia Brasil.`);
        return;
    }

    // Extrai o ID do remetente original (quem enviou o áudio)
    const originalSender = msg.contextInfo?.participant || msg.contextInfo?.remoteJid;
    if (!originalSender) {
        logger.warn(`Não foi possível identificar o remetente original do áudio.`);
        return;
    }

    try {
        // Envia a transcrição de volta ao remetente original
        await sock.sendMessage(originalSender, {
            text: `Sua transcrição está pronta:\n\n${transcription}`,
        });

        logger.info(`Transcrição enviada de volta ao remetente original: ${originalSender}`);

        // Salva a transcrição no banco de dados
        await saveTranscriptionToDatabase(originalSender, transcription);
        logger.info(`Transcrição salva no banco de dados para o remetente: ${originalSender}`);
    } catch (error) {
        logger.error(`Erro ao processar resposta de transcrição: ${error.message}`);
    }
}

// Função principal para conectar ao WhatsApp
async function connectToWhatsApp(authFolder) {
    // Aguarda 10 segundos para garantir que os bancos estão prontos
    await new Promise((resolve) => setTimeout(resolve, 10000));

    if (isReconnecting) {
        logger.info("Já está reconectando. Aguardando...");
        return;
    }

    logger.info("Tentando conectar ao WhatsApp...");
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
                logger.info("QR Code recebido. Escaneie-o no seu celular:");
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                isReconnecting = false;
                const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
                logger.error(`Conexão fechada: ${lastDisconnect.error?.message || 'Motivo desconhecido'}`);
                if (shouldReconnect) {
                    setTimeout(() => connectToWhatsApp(authFolder), 5000);
                }
            } else if (connection === 'open') {
                isReconnecting = false;
                logger.info("Conectado ao WhatsApp!");
            }
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0];
            if (msg.key.remoteJid && !msg.key.fromMe) {
                // Verifica se é uma resposta de transcrição
                if (msg.key.remoteJid === '5511987654321@s.whatsapp.net') {
                    await handleTranscriptionResponse(msg);
                } else {
                    processMessage(msg); // Processa a mensagem recebida
                    await addToQueue(msg); // Adiciona a mensagem à fila do Redis
                }
            }
        });
    } catch (error) {
        isReconnecting = false;
        logger.error(`Erro ao conectar: ${error.message}`);
        setTimeout(() => connectToWhatsApp(authFolder), 10000);
    }
}

// Função para manter o processo ativo
async function keepAlive() {
    while (true) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
}

// Obter a pasta de autenticação dos argumentos
const [authFolder] = process.argv.slice(2);
if (!authFolder) {
    logger.error('Erro: Pasta de autenticação não fornecida.');
    process.exit(1);
}

// Iniciar o bot e manter o processo ativo
connectToWhatsApp(authFolder);
keepAlive();

// Exportar a função para uso em outros módulos
module.exports = { connectToWhatsApp };