// ./src/models/Conversation.js
// Este arquivo define o modelo MongoDB para salvar mensagens no banco de dados.
// Ele também inclui um método de teste para verificar se o modelo está funcionando corretamente.

const mongoose = require("mongoose");

// Define o esquema para a coleção 'conversations'
const conversationSchema = new mongoose.Schema({
  sender: String, // Número do remetente
  message: String, // Texto da mensagem
  timestamp: { type: Date, default: Date.now }, // Data/hora da mensagem
});

// Cria o modelo 'Conversation'
const Conversation = mongoose.model("Conversation", conversationSchema);

// Método de teste para verificar o funcionamento do modelo
Conversation.test = async function () {
  console.log("Executando teste do modelo MongoDB...");
  try {
    const doc = await this.create({
      sender: "test-sender",
      message: "Mensagem de teste",
    });
    console.log("Documento inserido com sucesso:", doc._id);
  } catch (error) {
    console.error("Erro ao testar o modelo MongoDB:", error.message);
  }
};

module.exports = Conversation;
