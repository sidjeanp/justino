// ./src/database/db.js

require("dotenv").config();
const { Sequelize } = require("sequelize");
const logger = require("../../utils/logger");

// Importação dos modelos
const { Group, Customer, GroupCustomer, AudioTemp } = require("../models");

// Validação das variáveis de ambiente obrigatórias
function validateEnvironmentVariables() {
  const requiredVars = ["MYSQL_HOST", "MYSQL_USER", "MYSQL_PASSWORD"];
  for (const envVar of requiredVars) {
    if (!process.env[envVar]) {
      logger.error(`Variável de ambiente ${envVar} é obrigatória.`);
      process.exit(1);
    }
  }
}

validateEnvironmentVariables();

// Configuração da conexão com o MySQL
const sequelize = new Sequelize(process.env.MYSQL_DATABASE, process.env.MYSQL_USER, process.env.MYSQL_PASSWORD, {
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306,
  dialect: "mysql",
  dialectOptions: {
    connectTimeout: 10000,
  },
});

// Função para conectar ao banco de dados com tentativas automáticas
async function connectToDatabase() {
  const maxRetries = 10;
  const retryInterval = 5000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`Tentativa ${attempt} de ${maxRetries}: Conectando ao MySQL...`);
      await sequelize.authenticate();
      logger.info("Conexão com o MySQL estabelecida com sucesso.");
      return;
    } catch (error) {
      logger.error(`Erro ao conectar ao MySQL (tentativa ${attempt}): ${error.message}`);
      if (attempt === maxRetries) {
        logger.error(`Falha ao conectar ao MySQL após ${maxRetries} tentativas.`);
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, retryInterval));
    }
  }
}

// Função genérica para salvar ou atualizar um registro no banco de dados
async function saveOrUpdate(model, data, uniqueKey, logMessage) {
  try {
    const existingRecord = await model.findOne({ where: { [uniqueKey]: data[uniqueKey] } });
    if (!existingRecord) {
      await model.create(data);
      logger.info(`${logMessage} salvo no banco de dados: ${data.name || data.id}`);
    } else {
      await model.update(data, { where: { [uniqueKey]: data[uniqueKey] } });
      logger.info(`${logMessage} já existe no banco de dados: ${data.name || data.id}`);
    }
  } catch (error) {
    logger.error(`Erro ao salvar/atualizar ${logMessage}: ${error.message}`);
  }
}

// Função para salvar um grupo no banco de dados
async function saveGroupToDatabase(groupData) {
  if (!groupData.group_id || !groupData.name) {
    throw new Error("Os campos 'group_id' e 'name' são obrigatórios.");
  }
  await saveOrUpdate(Group, groupData, "group_id", "Grupo");
}

// Função para salvar um participante no banco de dados
async function saveParticipantToDatabase(participantData) {
  if (!participantData.customer_id || !participantData.name) {
    throw new Error("Os campos 'customer_id' e 'name' são obrigatórios.");
  }

  // Extrai o número de telefone apenas se o formato for válido
  participantData.phone_number = participantData.customer_id.includes("@")
    ? participantData.customer_id.split("@")[0]
    : null;

  await saveOrUpdate(Customer, participantData, "customer_id", "Participante");
}

// Função para associar um participante a um grupo
async function associateParticipantToGroup(participantId, groupId) {
  try {
    const participant = await Customer.findOne({ where: { customer_id: participantId } });
    const group = await Group.findOne({ where: { group_id: groupId } });

    if (!participant || !group) {
      logger.error("Participante ou grupo não encontrado.");
      return;
    }

    const [association, created] = await GroupCustomer.findOrCreate({
      where: { customer_id: participant.id, group_id: group.id },
      defaults: { allow_ai_interaction: true },
    });

    logger.info(
      created
        ? `Participante associado ao grupo: ${participant.name} -> ${group.name}`
        : `Participante já associado ao grupo: ${participant.name} -> ${group.name}`
    );
  } catch (error) {
    logger.error(`Erro ao associar participante ao grupo: ${error.message}`);
  }
}

// Função para salvar áudio no MongoDB
async function saveAudioToMongo(audioMessageId, sender, filePath) {
  try {
    await AudioTemp.create({ audioMessageId, sender, filePath, status: "pending" });
    logger.info(`Áudio salvo no MongoDB com ID: ${audioMessageId}`);
  } catch (error) {
    logger.error(`Erro ao salvar áudio no MongoDB: ${error.message}`);
  }
}

// Função para atualizar transcrição no MongoDB
async function updateTranscriptionInMongo(audioMessageId, transcription) {
  try {
    const audio = await AudioTemp.findOneAndUpdate(
      { audioMessageId },
      { transcription, status: "transcribed" },
      { new: true }
    );
    if (!audio) throw new Error("Áudio não encontrado no MongoDB.");
    logger.info(`Transcrição atualizada para áudio com ID: ${audioMessageId}`);
  } catch (error) {
    logger.error(`Erro ao atualizar transcrição: ${error.message}`);
  }
}

// Função para salvar transcrição no banco de dados
async function saveTranscriptionToDatabase(sender, transcription) {
  try {
    const participant = await Customer.findOne({ where: { participant_id: sender } });
    if (!participant) throw new Error(`Participante com ID ${sender} não encontrado.`);

    participant.summary = transcription;
    await participant.save();
    logger.info(`Transcrição salva para o participante: ${sender}`);
  } catch (error) {
    logger.error(`Erro ao salvar transcrição no banco de dados: ${error.message}`);
  }
}

module.exports = {
  sequelize,
  saveGroupToDatabase,
  saveParticipantToDatabase,
  associateParticipantToGroup,
  saveAudioToMongo,
  updateTranscriptionInMongo,
  saveTranscriptionToDatabase,
};

(async () => {
  await connectToDatabase();
})();