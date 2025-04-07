// models/Group.js
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Group extends Model {}
  Group.init(
    {
      group_id: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      allow_ai_interaction: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      summary: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      next_contact_instructions: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      permanent_instruction: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'Group',
      tableName: 'groups' // Nome exato da tabela no banco de dados
    }
  );
  return Group;
};