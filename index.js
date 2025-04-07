// ./index.js
// Este é o ponto de entrada principal da aplicação.
// Ele verifica o valor do flag TEST_MODE no arquivo .env para decidir se deve executar os testes ou iniciar a aplicação normalmente.

require('dotenv').config(); // Carrega variáveis de ambiente

if (process.env.TEST_MODE === 'true') {
    console.log('Modo de teste ativado. Executando testes...');
    require('./test'); // Importa e executa o módulo de testes
} else {
    console.log('Modo de teste desativado. Iniciando a aplicação...');
    const { connectToWhatsApp } = require('./src/whatsapp/connect');
    async function startApp() {
        try {
            await connectToWhatsApp(); // Inicia o bot do WhatsApp
            console.log('Bot do WhatsApp iniciado com sucesso.');
        } catch (error) {
            console.error('Erro ao iniciar a aplicação:', error.message);
            process.exit(1); // Encerra o processo em caso de erro
        }
    }
    startApp();
}