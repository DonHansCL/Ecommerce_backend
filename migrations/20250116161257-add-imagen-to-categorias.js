// backend/migrations/XXXXXXXXXXXXXX-add-imagen-to-categorias.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Categorias', 'imagen', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Categorias', 'imagen');
  }
};