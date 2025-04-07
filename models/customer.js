// ./src/database/models/customer.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Customer = sequelize.define('customer', {
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    allow_ai_interaction: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    next_contact_instructions: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    permanent_instruction: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = Customer;