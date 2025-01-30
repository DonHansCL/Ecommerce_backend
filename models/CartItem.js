// backend/models/CartItem.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CartItem = sequelize.define('CartItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
    carritoId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Carritos', 
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    productoId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Productos', 
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  }, {
    tableName: 'ItemsCarrito',
    timestamps: false,
  });

  // Asociaciones
  CartItem.associate = (models) => {
    //console.log('Asociando Cart con User, Product y CartItem'); // Log para depuración
    CartItem.belongsTo(models.Cart, { foreignKey: 'carritoId' });
    CartItem.belongsTo(models.Product, { foreignKey: 'productoId', as: 'product' });
  };

  return CartItem;
};