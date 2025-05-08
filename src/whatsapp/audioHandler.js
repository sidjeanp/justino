// ./src/whatsapp/audioHandler.js

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { saveAudioToMongo } = require("../database/db"); // Função para salvar no MongoDB
const logger = require("../../utils/logger");

// Caminho para a pasta config
const configDir = path.join('/app/src/config');

console.log('DirName: ', __dirname);
console.log('Caminho absoluto: ', configDir);

const { getConfig } = require(path.join(__dirname, '..', '..', 'config', 'configLoader'));

const zapiaBrasilJid = getConfig('zapia_br_jid');

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

    // Baixa o arquivo de áudio
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

async function downloadAudioFile(url) {
  // Usa o Axios para baixar o arquivo de áudio
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(response.data);
}

module.exports = { handleAudioMessage };