// ./migrations/20250420000000-create-ini.js
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("ini", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      session: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      key: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      value: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Adiciona um índice único para evitar duplicatas de session + key
    await queryInterface.addIndex("ini", ["session", "key"], {
      unique: true,
      name: "unique_session_key",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("ini");
  },
};
