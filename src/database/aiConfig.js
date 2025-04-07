// ./src/database/aiConfig.js
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI; // URL do MongoDB
const client = new MongoClient(uri);

async function getAIConfig() {
    try {
        await client.connect();
        const database = client.db('whatsapp_assist-justino');
        const configCollection = database.collection('config');

        // Buscar a configuração da IA
        const config = await configCollection.findOne({ type: 'ai' });
        if (!config) {
            throw new Error('Configuração de IA não encontrada no banco de dados.');
        }

        return config;
    } catch (error) {
        console.error('[ERROR] Falha ao buscar configuração de IA:', error.message);
        throw error;
    } finally {
        await client.close();
    }
}

module.exports = { getAIConfig };