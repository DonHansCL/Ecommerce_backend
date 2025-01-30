// backend/models/Cart.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Cart = sequelize.define('Cart', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Usuarios', // Asegúrate de que coincide con el tableName en User.js
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  }, {
    tableName: 'Carritos',
    timestamps: false,
  });

  // Asociaciones
  Cart.associate = (models) => {
    //console.log('Asociando Cart con User, Product y CartItem'); // Log para depuración
    Cart.belongsTo(models.User, { foreignKey: 'usuarioId' });
    Cart.belongsToMany(models.Product, { through: models.CartItem, foreignKey: 'carritoId' });
    Cart.hasMany(models.CartItem, { foreignKey: 'carritoId' });
  };

  return Cart;
};