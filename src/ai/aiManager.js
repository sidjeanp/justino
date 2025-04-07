// ./src/ai/aiManager.js
const { getAIConfig } = require('../database/aiConfig');
const { generateResponse: chatgptGenerateResponse } = require('./chatgpt');

async function getAIResponse(prompt) {
    try {
        // Obter a configuração da IA do banco de dados
        const aiConfig = await getAIConfig();
        const { aiType } = aiConfig;

        // Direcionar para o modelo de IA correto
        switch (aiType) {
            case 'chatgpt':
                return chatgptGenerateResponse(prompt);
            // Adicione outros casos aqui para outras IAs
            default:
                throw new Error(`Tipo de IA desconhecido: ${aiType}`);
        }
    } catch (error) {
        console.error('[ERROR] Falha ao obter resposta da IA:', error.message);
        return 'Desculpe, ocorreu um erro ao processar sua solicitação.';
    }
}

module.exports = { getAIResponse };