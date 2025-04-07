// ./src/database/models/index.js

const { Sequelize } = require('sequelize');
const sequelize = require('../db'); // Importa a instância do Sequelize configurada em db.js

// Importa os modelos individuais
const Customer = require('./customer')(sequelize);
const Contact = require('./contact')(sequelize);
const Group = require('./group')(sequelize); // Adiciona o modelo Group, se necessário
const GroupCustomer = require('./groupCustomer')(sequelize); // Adiciona o modelo GroupCustomer, se necessário

// Relacionamentos entre os modelos
// Um cliente pode ter muitos contatos
Customer.hasMany(Contact, { foreignKey: 'customer_id', as: 'contacts' });
Contact.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

// Um grupo pode ter muitos clientes (via GroupCustomer)
Group.belongsToMany(Customer, { through: GroupCustomer, foreignKey: 'group_id', as: 'customers' });
Customer.belongsToMany(Group, { through: GroupCustomer, foreignKey: 'customer_id', as: 'groups' });

// Exporta todos os modelos
module.exports = {
    Customer,
    Contact,
    Group,
    GroupCustomer
};