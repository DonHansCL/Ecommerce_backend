// YYYYMMDDHHMMSS-add-categoriaId-to-productos.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Productos', 'categoriaId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Categorias', // Asegúrate de que el nombre de la tabla sea correcto
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL', // O el comportamiento que prefieras
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Productos', 'categoriaId');
  }
};