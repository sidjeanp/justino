// src/whatsapp/transcriptionHandler.js

const { updateAudioTranscription } = require('../database/db'); // Função para atualizar no MongoDB
const { saveParticipantToDatabase } = require('../database/db'); // Função para salvar no MySQL
const logger = require('../utils/logger');

async function handleTranscriptionResponse(msg) {
  try {
    const transcription = msg.message?.conversation;
    const originalAudioMessageId = msg.contextInfo?.stanzaId; // ID da mensagem original
    if (!originalAudioMessageId || !transcription) {
      logger.warn('Resposta de transcrição inválida.');
      return;
    }

    // Atualiza o áudio com a transcrição
    const audio = await updateAudioTranscription(originalAudioMessageId, transcription);

    if (audio) {
      logger.info(`Transcrição recebida para áudio com ID: ${originalAudioMessageId}`);

      let participant = {
        customer_id: audio.sender,
        participant_id: audio.sender,
        name: transcription.split(' ')[0], // Exemplo: usa a primeira palavra como nome
        allow_ai_interaction: true, // Define se a IA pode interagir com o participante
        // group_id: remoteJid,
      };
      // Cadastra ou atualiza o usuário no MySQL
      await saveParticipantToDatabase(participant);
    }
  } catch (error) {
    logger.error(`Erro ao processar transcrição: ${error.message}`);
  }
}

module.exports = { handleTranscriptionResponse };