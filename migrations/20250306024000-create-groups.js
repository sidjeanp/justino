'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('groups', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      group_id: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      allow_ai_interaction: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      summary: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      next_contact_instructions: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      permanent_instruction: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('groups');
  },
};