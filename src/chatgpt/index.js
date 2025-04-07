// ./src/chatgpt/index.js
const axios = require('axios');

// Configuração da API do ChatGPT
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL;
const OPENAI_API_URL = process.env.OPENAI_API_URL;

// Função para enviar uma mensagem ao ChatGPT e receber uma resposta
async function getChatGPTResponse(message) {
    try {
        const response = await axios.post(
            OPENAI_API_URL,
            {
                model: OPENAI_MODEL,
                messages: [{ role: 'user', content: message }],
                max_tokens: 100, // Limite de tokens na resposta
                temperature: 0.7, // Controla a criatividade da resposta
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                },
            }
        );

        // Extrai a resposta do ChatGPT
        const reply = response.data.choices[0].message.content.trim();
        return reply;
    } catch (error) {
        console.error('Erro ao chamar a API do ChatGPT:', error.response?.data || error.message);
        throw error;
    }
}

module.exports = { getChatGPTResponse };