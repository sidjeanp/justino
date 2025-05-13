// ./src/whatsapp/connect.js

const logger = require("../../utils/logger");
const path = require("path");
const {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeWASocket,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const qrcode = require("qrcode-terminal");
const { addToQueue } = require("./queueManager");
const {
  saveGroupToDatabase,
  saveParticipantToDatabase,
  associateParticipantToGroup,
  saveTranscriptionToDatabase,
} = require("../database/db");
const { handleAudioMessage } = require("./audioHandler");

// Carrega as configurações
const { getConfig } = require(path.join(__dirname, "..", "..", "config", "configLoader"));
const zapiaBrasilJid = getConfig("zapia_br_jid");

// Variáveis globais
let sock;
let isReconnecting = false;

/**
 * Processa mensagens recebidas.
 * @param {Object} msg - Mensagem recebida.
 */
async function processMessage(msg) {
  try {
    const remoteJid = msg.key.remoteJid;
    const sender = msg.key.participant || remoteJid;
    const senderName = msg.pushName || sender.split("@")[0];

    logger.info(`Processando mensagem de: ${senderName} (${remoteJid})`);

    // Identifica o tipo de comunicação
    identifyCommunicationType(remoteJid);

    if (remoteJid.endsWith("@g.us")) {
      await handleGroupMessage(remoteJid, sender, senderName);
    } else if (remoteJid.endsWith("@s.whatsapp.net")) {
      await handleIndividualMessage(sender, senderName);
    }

    // Processa o conteúdo da mensagem
    await processMessageContent(msg);
  } catch (error) {
    logger.error(`Erro ao processar mensagem: ${error.message}`);
  }
}

/**
 * Identifica o tipo de comunicação com base no JID.
 * @param {string} remoteJid - ID remoto da mensagem.
 */
function identifyCommunicationType(remoteJid) {
  const type = remoteJid.split("@")[1];
  switch (type) {
    case "g.us":
      logger.info("Grupo");
      break;
    case "s.whatsapp.net":
      logger.info("Contato Individual");
      break;
    case "broadcast":
      logger.info("Lista de Transmissão");
      break;
    case "newsletter":
      logger.info("Newsletter");
      break;
    case "road":
      logger.info("Mensagem de Sistema");
      break;
    case "status":
      logger.info("Atualização de Status");
      break;
    default:
      logger.info("Desconhecido");
      break;
  }
}

/**
 * Processa mensagens de grupo.
 * @param {string} remoteJid - ID do grupo.
 * @param {string} sender - ID do participante.
 * @param {string} senderName - Nome do participante.
 */
async function handleGroupMessage(remoteJid, sender, senderName) {
  try {
    const groupMetadata = await sock.groupMetadata(remoteJid);
    const groupName = groupMetadata.subject;

    logger.info(`Grupo: ${groupName} | Enviada por: ${senderName}`);

    // Salva o grupo no banco de dados
    await saveGroupToDatabase({
      group_id: remoteJid,
      name: groupName,
      allow_ai_interaction: true,
      summary: `Grupo identificado como ${groupName}.`,
    });

    // Salva o participante no banco de dados
    const participant = {
      customer_id: sender,
      participant_id: sender,
      name: senderName,
      allow_ai_interaction: true,
    };
    await saveParticipantToDatabase(participant);

    // Associa o participante ao grupo
    await associateParticipantToGroup(sender, remoteJid);
  } catch (error) {
    logger.warn(`Não foi possível obter metadados do grupo: ${error.message}`);
  }
}

/**
 * Processa mensagens individuais.
 * @param {string} sender - ID do remetente.
 * @param {string} senderName - Nome do remetente.
 */
async function handleIndividualMessage(sender, senderName) {
  const participant = {
    customer_id: sender,
    participant_id: sender,
    name: senderName,
    allow_ai_interaction: true,
  };

  // Salva o usuário no banco de dados (se ainda não existir)
  await saveParticipantToDatabase(participant);
}

/**
 * Processa o conteúdo da mensagem.
 * @param {Object} msg - Mensagem recebida.
 */
async function processMessageContent(msg) {
  let messageText = "";

  if (msg.message?.conversation) {
    messageText = msg.message.conversation;
  } else if (msg.message?.extendedTextMessage?.text) {
    messageText = msg.message.extendedTextMessage.text;
  } else if (msg.message?.imageMessage?.caption) {
    messageText = msg.message.imageMessage.caption;
  } else if (msg.message?.audioMessage) {
    await handleAudioMessage(msg);
    return; // Sai após tratar o áudio
  } else {
    messageText = "Mensagem não suportada";
  }

  logger.info(`Conteúdo: ${messageText}`);
}

/**
 * Processa a resposta de transcrição de "Zapia Brasil".
 * @param {Object} msg - Mensagem recebida.
 */
async function handleTranscriptionResponse(msg) {
  const remoteJid = msg.key.remoteJid;

  // Verifica se a mensagem é de "Zapia Brasil"
  const isFromZapiaBrasil = remoteJid === zapiaBrasilJid;
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

/**
 * Conecta ao WhatsApp.
 * @param {string} authFolder - Pasta de autenticação.
 */
async function connectToWhatsApp(authFolder) {
  await new Promise((resolve) => setTimeout(resolve, 10000)); // Aguarda inicialização dos bancos de dados

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
      logger: pino({ level: "silent" }),
      printQRInTerminal: true,
      auth: state,
      version,
    });

    sock.ev.on("connection.update", async (update) => {
      const { connection, qr, lastDisconnect } = update;

      if (qr) {
        logger.info("QR Code recebido. Escaneie-o no seu celular:");
        qrcode.generate(qr, { small: true });
      }

      if (connection === "close") {
        isReconnecting = false;
        const shouldReconnect =
          lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
        logger.error(
          `Conexão fechada: ${
            lastDisconnect.error?.message || "Motivo desconhecido"
          }`
        );
        if (shouldReconnect) {
          setTimeout(() => connectToWhatsApp(authFolder), 5000);
        }
      } else if (connection === "open") {
        isReconnecting = false;
        logger.info("Conectado ao WhatsApp!");
      }
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async (m) => {
      const msg = m.messages[0];
      if (msg.key.remoteJid && !msg.key.fromMe) {
        if (msg.key.remoteJid === zapiaBrasilJid) {
          await handleTranscriptionResponse(msg);
        } else {
          await processMessage(msg); // Processa a mensagem recebida
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

// Mantém o processo ativo
async function keepAlive() {
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

// Obter a pasta de autenticação dos argumentos
const [authFolder] = process.argv.slice(2);
if (!authFolder) {
  logger.error("Erro: Pasta de autenticação não fornecida.");
  process.exit(1);
}

// Iniciar o bot e manter o processo ativo
connectToWhatsApp(authFolder);
keepAlive();

// Exportar a função para uso em outros módulos
module.exports = { connectToWhatsApp };