// ./src/whatsapp/audioHandler.js

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { saveAudioToMongo } = require("../database/db"); // Função para salvar no MongoDB
const logger = require("../../utils/logger");

// Caminho absoluto para a pasta config
const configDir = path.join(__dirname, "..", "..", "config");
logger.info(`Caminho absoluto para a pasta config: ${configDir}`);

// Carrega as configurações
const { getConfig } = require(path.join(configDir, "configLoader"));
const zapiaBrasilJid = getConfig("zapia_br_jid");

/**
 * Processa mensagens de áudio.
 * @param {Object} msg - Mensagem recebida.
 */
async function handleAudioMessage(msg) {
  try {
    const audioMessage = msg.message.audioMessage;
    const sender = msg.key.participant || msg.key.remoteJid;

    // Gera um ID único para o áudio
    const audioMessageId = msg.key.id;

    // Define o caminho do arquivo
    const fileName = `${audioMessageId}.${audioMessage.mimetype.split("/")[1]}`;
    const filePath = path.join(__dirname, "..", "audio_files", fileName);

    // Cria o diretório se ele não existir
    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }

    // Baixa e salva o arquivo de áudio
    const audioBuffer = await downloadAudioFile(audioMessage.url);
    fs.writeFileSync(filePath, audioBuffer);

    // Salva os dados no MongoDB
    await saveAudioToMongo(audioMessageId, sender, filePath);

    // Encaminha o áudio para o Zapia Brasil
    await sock.sendMessage(zapiaBrasilJid, {
      forwardedFrom: msg.key.remoteJid,
      audio: audioMessage.url,
      mimetype: audioMessage.mimetype,
      fileName: "audio-transcricao",
    });

    logger.info(`Áudio salvo e encaminhado para Zapia Brasil: ${filePath}`);
  } catch (error) {
    logger.error(`Erro ao processar áudio: ${error.message}`);
  }
}

/**
 * Baixa o arquivo de áudio.
 * @param {string} url - URL do arquivo de áudio.
 * @returns {Buffer} - Buffer do arquivo baixado.
 */
async function downloadAudioFile(url) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(response.data);
  } catch (error) {
    logger.error(`Erro ao baixar arquivo de áudio: ${error.message}`);
    throw error;
  }
}

module.exports = { handleAudioMessage };