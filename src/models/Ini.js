// src/models/Ini.js
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Ini extends Model {}
  
  Ini.init(
    {
      session: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      key: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Ini',
      tableName: 'ini', // Nome exato da tabela no banco de dados
      timestamps: true,
    }
  );

  Ini.associate = function (models) {
    // Não há associações necessárias para esta tabela
  };

  return Ini;
};