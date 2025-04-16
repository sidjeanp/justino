// /utils/logger.js

const winston = require('winston');

// Define os formatos dos logs
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  })
);

// Cria o logger
const logger = winston.createLogger({
  level: 'info', // Nível mínimo de log
  format: customFormat,
  transports: [
    new winston.transports.Console(), // Logs no console
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }), // Logs de erro em arquivo
    new winston.transports.File({ filename: 'logs/combined.log' }), // Todos os logs em arquivo
  ],
});

module.exports = logger;