// ./config/configLoader.js

const path = require('path');
const { Ini } = require(path.join(__dirname, '..', 'src', 'models')); // Importa o modelo Ini

let configCache = {};

async function loadConfig() {
  try {
    const configs = await Ini.findAll({
      where: { session: 'whatsapp' }, // Filtra por sessão
    });

    configs.forEach((config) => {
      configCache[config.key] = config.value;
    });

    console.log('[Config Loader] Configurações carregadas:', configCache);
  } catch (error) {
    console.error('[Config Loader] Erro ao carregar configurações:', error.message);
  }
}

function getConfig(key) {
  return configCache[key];
}

module.exports = { loadConfig, getConfig };