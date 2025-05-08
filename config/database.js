// ./config/database.js

require('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env

const { Sequelize } = require('sequelize');

// Validação das variáveis de ambiente
if (!process.env.MYSQL_USER) {
  console.error('Variável de ambiente MYSQL_USER é obrigatória.');
  process.exit(1);
}
if (!process.env.MYSQL_PASSWORD) {
  console.error('Variável de ambiente MYSQL_PASSWORD é obrigatória.');
  process.exit(1);
}

const sequelize = new Sequelize(
    process.env.MYSQL_DATABASE,
    process.env.MYSQL_USER,
    process.env.MYSQL_PASSWORD,
    {
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306,
      dialect: "mysql",
      logging: false,
    }
  );
  
// Testar conexão
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o MySQL estabelecida com sucesso.');
  } catch (error) {
    console.error('Erro ao conectar ao MySQL:', error.message);
    process.exit(1); // Encerra o processo se houver erro
  }
})();

module.exports = sequelize;