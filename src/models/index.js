// src/models/index.js

const fs = require("fs");
const path = require("path");
const SequelizeLib = require("sequelize"); // Biblioteca Sequelize para interação com o banco de dados
require("dotenv").config(); // Carrega as variáveis de ambiente

// Nome do arquivo atual (index.js)
const basename = path.basename(__filename);

// Determina o ambiente (development, test, production)
const env = process.env.NODE_ENV || "development";

// Objeto que armazenará todos os modelos
const db = {};

// Cria uma instância do Sequelize com base nas variáveis de ambiente
const sequelize = new SequelizeLib(
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306,
    dialect: "mysql",
    logging: false, // Desativa logs do Sequelize para evitar poluição no console
  }
);

// Lê todos os arquivos no diretório `models`
fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 && // Ignora arquivos ocultos
      file !== basename && // Ignora o próprio arquivo index.js
      file.slice(-3) === ".js" && // Aceita apenas arquivos com extensão .js
      file.indexOf(".test.js") === -1 // Ignora arquivos de teste
    );
  })
  .forEach((file) => {
    const modelModule = require(path.join(__dirname, file)); // Importa o módulo do modelo
    const model = modelModule(sequelize); // Inicializa o modelo com a instância do Sequelize
    db[model.name] = model; // Adiciona o modelo ao objeto `db`
  });

// Define os relacionamentos entre os modelos
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db); // Passa todos os modelos para a função associate
  }
});

// Adiciona a instância do Sequelize e a classe Sequelize ao objeto `db`
db.sequelize = sequelize; // Instância do Sequelize
db.Sequelize = SequelizeLib; // Classe Sequelize para uso em outros lugares

// Exporta o objeto `db` para ser usado em outros arquivos
module.exports = db;