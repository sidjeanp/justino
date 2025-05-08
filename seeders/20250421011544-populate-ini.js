"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    await queryInterface.bulkInsert("ini", [
      {
        session: "whatsapp",
        key: "zapia_br_jid",
        value: "551132302407@s.whatsapp.net",
        createdAt: now,
        updatedAt: now,
      },
      {
        session: "whatsapp",
        key: "target_group_id",
        value: "1234567890-123456789@g.us",
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("ini", null, {});
  },
};
