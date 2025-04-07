// ./src/database/models/contact.js
const { DataTypes } = require('sequelize');
const sequelize = require('../src/database/db');

const Contact = sequelize.define('contact', {
    phone_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
    },
    is_primary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

module.exports = Contact;