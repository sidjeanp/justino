// models/Customer.js
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Customer extends Model {}
  Customer.init(
    {
      customer_id: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false
      },
      participant_id: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false,
      },    
       
      name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      contact_name: {
        type: DataTypes.STRING(100),
        allowNull: true, // Nome amigável que pode ser editado manualmente
      },
      phone_number: {
        type: DataTypes.STRING(20),
        allowNull: true, // Número de telefone extraído do participant_id
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
      modelName: 'Customer',
      tableName: 'customers' // Nome exato da tabela no banco de dados
    }
  );

  Customer.associate = function (models) {
    Customer.hasMany(models.GroupCustomer, { foreignKey: 'customer_id' });
  };  
  return Customer;
};