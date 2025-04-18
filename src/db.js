// src/db.js

// Importa o pacote mongoose para interagir com o MongoDB
const mongoose = require("mongoose");

// Função assíncrona para conectar ao MongoDB
const connectDB = async () => {
  try {
    // Tenta conectar ao MongoDB usando a URI fornecida nas variáveis de ambiente
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true, // Usa o novo parser de URL para evitar erros de conexão
      useUnifiedTopology: true, // Usa o novo mecanismo de monitoramento de servidor
      serverSelectionTimeoutMS: 30000, // Timeout de 30 segundos
    });

    // Exibe uma mensagem no console quando a conexão é bem-sucedida
    console.log("Conectado ao MongoDB!");
  } catch (error) {
    // Captura e registra erros durante a conexão com o MongoDB
    console.error("Erro ao conectar ao MongoDB:", error.message);

    // Encerra o processo Node.js com código de erro (1)
    process.exit(1);
  }
};

// Exporta a função connectDB para ser usada em outros módulos
module.exports = connectDB;
