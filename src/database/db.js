// ./src/database/db.js

const { Sequelize } = require('sequelize');

// Função para formatar data e hora
function getFormattedDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString('pt-BR');
    const time = now.toLocaleTimeString('pt-BR');
    return `${date} ${time}`;
}

// Configuração da conexão com o MySQL
const sequelize = new Sequelize('justino', 'user', 'password', {
    host: process.env.MYSQL_HOST || 'mysql',
    port: process.env.MYSQL_PORT || 3306,
    dialect: 'mysql',
});

// Importação dos modelos
const Group = require('../models/Group')(sequelize); // Ajuste conforme a estrutura dos seus modelos
const Customer = require('../models/Customer')(sequelize);

// Testar conexão
(async () => {
    try {
        await sequelize.authenticate();
        console.log('Conexão com o MySQL estabelecida com sucesso.');
    } catch (error) {
        console.error('Erro ao conectar ao MySQL:', error.message);
        process.exit(1); // Encerra o processo se houver erro
    }
})();

// Função para salvar um grupo no banco de dados
async function saveGroupToDatabase(groupData) {
    try {
        const existingGroup = await Group.findOne({ where: { group_id: groupData.group_id } });
        if (!existingGroup) {
            await Group.create(groupData);
            console.log(`[${getFormattedDateTime()}] Grupo salvo no banco de dados:`, groupData.name);
        } else {
            console.log(`[${getFormattedDateTime()}] Grupo já existe no banco de dados:`, groupData.name);
        }
    } catch (error) {
        console.error(`[${getFormattedDateTime()}] Erro ao salvar grupo no banco de dados:`, error.message);
    }
}

// Função para salvar um participante no banco de dados
async function saveParticipantToDatabase(participantData) {
    try {
        const existingParticipant = await Customer.findOne({ where: { participant_id: participantData.participant_id } });
        if (!existingParticipant) {
            await Customer.create(participantData);
            console.log(`[${getFormattedDateTime()}] Participante salvo no banco de dados:`, participantData.name);
        } else {
            console.log(`[${getFormattedDateTime()}] Participante já existe no banco de dados:`, participantData.name);
        }
    } catch (error) {
        console.error(`[${getFormattedDateTime()}] Erro ao salvar participante no banco de dados:`, error.message);
    }
}

// Exportação correta
module.exports = {
    sequelize,
    saveGroupToDatabase,
    saveParticipantToDatabase
};