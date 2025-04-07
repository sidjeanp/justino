// models/GroupCustomer.js
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class GroupCustomer extends Model {}
  GroupCustomer.init(
    {
      allow_ai_interaction: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      sequelize,
      modelName: 'GroupCustomer'
    }
  );
  return GroupCustomer;
};