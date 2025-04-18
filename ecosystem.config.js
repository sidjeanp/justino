//./ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "justino-instance-1",
      script: "./src/whatsapp/connect.js", // Caminho correto para o script principal
      args: "/app/instances/instance-1/auth_info_baileys", // Pasta de autenticação exclusiva
      env: {
        INSTANCE_NAME: "instance-1",
        NODE_ENV: "development",
        AUTH_FOLDER: "/app/instances/instance-1/auth_info_baileys", // Caminho absoluto
        REDIS_HOST: "redis",
        REDIS_PORT: 6379,
        MONGO_URI:
          "mongodb://root:example@mongo:27017/justino?authSource=admin",
      },
      env_production: {
        NODE_ENV: "production",
        REDIS_HOST: process.env.REDIS_HOST || "redis",
        REDIS_PORT: process.env.REDIS_PORT || 6379,
        MONGO_URI:
          process.env.MONGO_URI ||
          "mongodb://root:example@mongo:27017/justino?authSource=admin",
      },
      autorestart: false,
      max_restarts: 5,
      restart_delay: 10000,
      log_file: "./logs/pm2.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      merge_logs: true,
    },
  ],
};
