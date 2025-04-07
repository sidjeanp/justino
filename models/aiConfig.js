// ./src/database/models/aiConfig.js
const { DataTypes } = require('sequelize');
const sequelize = require('../src/database/db');

const AIConfig = sequelize.define('ai_config', {
    ai_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = AIConfig;