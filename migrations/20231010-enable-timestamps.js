'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Pedidos', 'createdAt', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()')
    });
    await queryInterface.addColumn('Pedidos', 'updatedAt', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('NOW()')
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Pedidos', 'createdAt');
    await queryInterface.removeColumn('Pedidos', 'updatedAt');
  }
};