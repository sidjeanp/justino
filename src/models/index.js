// models/index.js
'use strict';

// Importa as dependências necessárias
const fs = require('fs'); // Para ler arquivos no diretório
const path = require('path'); // Para manipular caminhos de arquivos
const Sequelize = require('sequelize'); // Biblioteca Sequelize para interação com o banco de dados
const process = require('process'); // Para acessar variáveis de ambiente

// Nome do arquivo atual (index.js)
const basename = path.basename(__filename);

// Determina o ambiente (development, test, production)
const env = process.env.NODE_ENV || 'development';

// Carrega a configuração do banco de dados com base no ambiente
const config = require(__dirname + '/../config/config.json')[env];

// Objeto que armazenará todos os modelos
const db = {};

// Cria uma instância do Sequelize com base na configuração
let sequelize;
if (config.use_env_variable) {
  // Se usar variáveis de ambiente para configurar o banco de dados
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  // Caso contrário, usa as configurações diretas do arquivo JSON
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Lê todos os arquivos no diretório `models`
fs
  .readdirSync(__dirname) // Lista todos os arquivos no diretório atual
  .filter(file => {
    // Filtra apenas os arquivos que são modelos válidos
    return (
      file.indexOf('.') !== 0 && // Ignora arquivos ocultos (ex.: .gitignore)
      file !== basename && // Ignora o próprio arquivo index.js
      file.slice(-3) === '.js' && // Aceita apenas arquivos com extensão .js
      file.indexOf('.test.js') === -1 // Ignora arquivos de teste (ex.: model.test.js)
    );
  })
  .forEach(file => {
    // Importa cada modelo e o adiciona ao objeto `db`
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model; // Armazena o modelo pelo nome no objeto `db`
  });

// Define os relacionamentos entre os modelos
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    // Se o modelo tiver um método `associate`, chama-o passando todos os modelos
    db[modelName].associate(db);
  }
});

// Adiciona a instância do Sequelize e a classe Sequelize ao objeto `db`
db.sequelize = sequelize; // Instância do Sequelize
db.Sequelize = Sequelize; // Classe Sequelize para uso em outros lugares

// Exporta o objeto `db` para ser usado em outros arquivos
module.exports = db;