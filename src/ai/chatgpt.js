// ./src/chatgpt.js
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

// Configuração da API do ChatGPT
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Função para gerar resposta usando o ChatGPT
async function generateResponse(prompt) {
    try {
        const response = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo', // Modelo do ChatGPT
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 100, // Limite de tokens na resposta
        });
        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('[ERROR] Falha ao gerar resposta do ChatGPT:', error.message);
        return 'Desculpe, ocorreu um erro ao processar sua solicitação.';
    }
}

module.exports = { generateResponse };// ./src/chatgpt.js
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

// Configuração da API do ChatGPT
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Função para gerar resposta usando o ChatGPT
async function generateResponse(prompt) {
    try {
        const response = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo', // Modelo do ChatGPT
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 100, // Limite de tokens na resposta
        });
        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('[ERROR] Falha ao gerar resposta do ChatGPT:', error.message);
        return 'Desculpe, ocorreu um erro ao processar sua solicitação.';
    }
}

module.exports = { generateResponse };