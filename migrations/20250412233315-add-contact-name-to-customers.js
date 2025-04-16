'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {

    await queryInterface.addColumn('customers', 'contact_name', {
      type: Sequelize.STRING(100),
      allowNull: true,
      
    });
  },

  async down (queryInterface, Sequelize) {

    await queryInterface.removeColumn('customers', 'contact_name');

  }
};
