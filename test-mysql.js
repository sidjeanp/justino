// test-mysql.js
const mysql = require('mysql2/promise');
require('dotenv').config(); // Carrega variáveis de ambiente

async function testMySQL() {
    console.log('Testando conexão ao MySQL...');
    try {
        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST || 'mysql', // Usa o valor do .env ou o padrão 'mysql'
            port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
            user: process.env.MYSQL_USER || 'user',
            password: process.env.MYSQL_PASSWORD || 'password',
            database: process.env.MYSQL_DATABASE || 'justino',
        });
        console.log('Conexão ao MySQL bem-sucedida!');
        await connection.end();
    } catch (error) {
        console.error('Erro ao conectar ao MySQL:', error.message);
    }
}

testMySQL();