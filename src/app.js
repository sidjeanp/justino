// src/app.js

// Carrega as variáveis de ambiente do arquivo .env
require('dotenv').config();

// Importa o framework Express para criar o servidor HTTP
const express = require('express');

const cors = require('cors'); // Para permitir requisições de diferentes origens

const customersRoute = require('./routes/customers');

// Aguarda 20 segundos para garantir que o MySQL esteja pronto
await new Promise(resolve => setTimeout(resolve, 20000));

// Importa a função connectToWhatsApp do módulo ./whatsapp/connect
// Esta função é responsável por estabelecer a conexão com o WhatsApp
const { connectToWhatsApp } = require('./whatsapp/connect');

// Cria uma instância do aplicativo Express
const app = express();

// Define a porta onde o servidor será executado
// Usa a variável de ambiente PORT, ou 3000 como padrão
const PORT = process.env.PORT || 3000;


// Chama a função connectToWhatsApp para iniciar a conexão com o WhatsApp
// Esta função configura o socket, gera o QR Code (se necessário) e trata eventos de mensagens
connectToWhatsApp();

// Define uma rota GET para a raiz ('/') do servidor
// Esta rota é usada para verificar se o servidor está rodando
app.get('/', (req, res) => {
    // Retorna uma mensagem simples para confirmar que o servidor está ativo
    res.send('WhatsApp Assist Justino está rodando!');
});

// Inicia o servidor Express na porta especificada
// O servidor fica ouvindo requisições HTTP
app.listen(PORT, () => {
    // Exibe uma mensagem no console indicando que o servidor foi iniciado
    console.log(`Servidor rodando na porta ${PORT}`);
});

// Middleware
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/customers', customersRoute);