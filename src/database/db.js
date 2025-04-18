// ./src/database/db.js
const { Sequelize } = require("sequelize");
const logger = require("../../utils/logger");

if (!process.env.MYSQL_HOST) {
  logger.error("Variável de ambiente MYSQL_HOST é obrigatória.");
  process.exit(1);
}
if (!process.env.MYSQL_USER) {
  logger.error("Variável de ambiente MYSQL_USER é obrigatória.");
  process.exit(1);
}
if (!process.env.MYSQL_PASSWORD) {
  logger.error("Variável de ambiente MYSQL_PASSWORD é obrigatória.");
  process.exit(1);
}

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306,
    dialect: "mysql",
    dialectOptions: {
      connectTimeout: 10000,
    },
  }
);

async function connectToDatabase() {
  const maxRetries = 10;
  const retryInterval = 5000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(
        `Tentativa ${attempt} de ${maxRetries}: Conectando ao MySQL...`
      );
      await sequelize.authenticate();
      logger.info("Conexão com o MySQL estabelecida com sucesso.");
      return;
    } catch (error) {
      logger.error(
        `Erro ao conectar ao MySQL (tentativa ${attempt}): ${error.message}`
      );
      if (attempt === maxRetries) {
        logger.error(
          `Falha ao conectar ao MySQL após ${maxRetries} tentativas.`
        );
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, retryInterval));
    }
  }
}

const { Group, Customer, GroupCustomer } = require("../models");

async function saveGroupToDatabase(groupData) {
  try {
    logger.info("Incluindo grupo.");
    if (!groupData.group_id || !groupData.name) {
      throw new Error("Os campos 'group_id' e 'name' são obrigatórios.");
    }

    const existingGroup = await Group.findOne({
      where: { group_id: groupData.group_id },
    });
    if (!existingGroup) {
      await Group.create(groupData);
      logger.info(`Grupo salvo no banco de dados: ${groupData.name}`);
    } else {
      logger.info(`Grupo já existe no banco de dados: ${groupData.name}`);
    }
  } catch (error) {
    logger.error(`Erro ao salvar grupo no banco de dados: ${error.message}`);
  }
}

async function saveParticipantToDatabase(participantData) {
  try {
    logger.info("Incluindo participante.");
    logger.info(
      `Dados do participante recebido:`,
      JSON.stringify(participantData)
    );

    if (!participantData.customer_id || !participantData.name) {
      throw new Error("Os campos 'customer_id' e 'name' são obrigatórios.");
    }

    // Extrai o número de telefone apenas se o formato for válido
    let phoneNumber = null;
    if (participantData.customer_id.includes("@")) {
      phoneNumber = participantData.customer_id.split("@")[0];
    } else {
      logger.warn(
        `Formato inválido para customer_id: ${participantData.customer_id}`
      );
    }

    participantData.phone_number = phoneNumber;

    logger.info(
      `Dados do participante recebido2:`,
      JSON.stringify(participantData)
    );

    const existingParticipant = await Customer.findOne({
      where: { customer_id: participantData.customer_id },
    });

    if (!existingParticipant) {
      await Customer.create(participantData);
      logger.info(
        `Participante salvo no banco de dados: ${participantData.name}`
      );
    } else {
      await Customer.update(participantData);
      logger.info(
        `Participante já existe no banco de dados: ${participantData.name}`
      );
    }
  } catch (error) {
    logger.error(
      `Erro ao salvar participante no banco de dados: ${error.message}`
    );
  }
}

async function associateParticipantToGroup(participantId, groupId) {
  try {
    logger.info("Indentificando grupo do participante.");
    const participant = await Customer.findOne({
      where: { customer_id: participantId },
    });
    const group = await Group.findOne({ where: { group_id: groupId } });

    logger.info("Localizado participante: ", JSON.stringify(participant));
    logger.info("Localizado grupo: ", JSON.stringify(group));

    if (!participant || !group) {
      logger.error("Participante ou grupo não encontrado.");
      return;
    }

    const [association, created] = await GroupCustomer.findOrCreate({
      where: { customer_id: participant.id, group_id: group.id },
      defaults: { allow_ai_interaction: true },
    });

    if (created) {
      logger.info(
        `Participante associado ao grupo: ${participant.name} -> ${group.name}`
      );
    } else {
      logger.info(
        `Participante já associado ao grupo: ${participant.name} -> ${group.name}`
      );
    }
  } catch (error) {
    logger.error(`Erro ao associar participante ao grupo: ${error.message}`);
  }
}

module.exports = {
  sequelize,
  saveGroupToDatabase,
  saveParticipantToDatabase,
  associateParticipantToGroup,
};

(async () => {
  await connectToDatabase();
})();
