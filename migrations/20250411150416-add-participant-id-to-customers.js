'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {

    await queryInterface.addColumn('customers', 'participant_id', {
      type: Sequelize.STRING(50),
      unique: true,
      allowNull: false,
    });

  },

  async down (queryInterface, Sequelize) {

    await queryInterface.removeColumn('customers', 'participant_id');
    
  }
};
