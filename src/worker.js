// src/worker.js

// Importa a fila (messageQueue) configurada com Redis e Bull
const messageQueue = require('./queue');

// Importa a função getChatGPTResponse para integrar o ChatGPT e gerar respostas automáticas
const getChatGPTResponse = require('./chatgpt');

// Importa a função connectToWhatsApp para estabelecer a conexão com o WhatsApp
const { connectToWhatsApp } = require('./whatsapp/connect');

// Função assíncrona autoexecutável para processar mensagens na fila
(async () => {
    // Conecta ao WhatsApp e obtém a instância do socket
    const sock = await connectToWhatsApp();

    // Configura o processamento da fila
    messageQueue.process(async (job) => {
        // Extrai os dados da mensagem da fila (remetente e texto)
        const { sender, text } = job.data;

        // Exibe no console a mensagem que está sendo processada
        console.log(`Processando mensagem de ${sender}:`, text);

        try {
            // Obtém uma resposta do ChatGPT com base no texto recebido
            const response = await getChatGPTResponse(text);

            // Envia a resposta gerada pelo ChatGPT ao remetente via WhatsApp
            await sock.sendMessage(sender, { text: response });

            // Exibe no console a resposta enviada
            console.log(`Resposta enviada para ${sender}:`, response);
        } catch (error) {
            // Trata erros durante o processamento da mensagem
            console.error('Erro ao processar mensagem na fila:', error.message);

            // Envia uma mensagem de erro padrão ao remetente, se necessário
            await sock.sendMessage(sender, { text: 'Desculpe, ocorreu um erro ao processar sua solicitação.' });
        }
    });
})();