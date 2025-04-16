// models/GroupCustomer.js

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GroupCustomer = sequelize.define('GroupCustomer', {
    allow_ai_interaction: { 
      type: DataTypes.BOOLEAN, 
      defaultValue: true // Permite ou não a interação da IA com o cliente no grupo
    }
  }, {
    tableName: 'group_customers' // Nome exato da tabela no banco de dados
  });

  // Define as associações entre os modelos
  GroupCustomer.associate = function (models) {
    // Relacionamento muitos-para-muitos entre Customer e Group
    GroupCustomer.belongsTo(models.Customer, { foreignKey: 'customerId' }); // Um GroupCustomer pertence a um Customer
    GroupCustomer.belongsTo(models.Group, { foreignKey: 'groupId' }); // Um GroupCustomer pertence a um Group
  };

  return GroupCustomer;
};