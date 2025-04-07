// ./src/database/models/customerInteractions.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const CustomerInteractions = sequelize.define('customer_interactions', {
    customer_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    response: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    ai_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
}, {
    timestamps: true,
    createdAt: 'interaction_time',
    updatedAt: false,
});

module.exports = CustomerInteractions;