// backend/models/Order.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Usuarios',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    direccionEnvio: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    metodoPago: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM(['pendiente', 'enviado', 'entregado', 'cancelado']),
      allowNull: false,
    },
  }, {
    tableName: 'Pedidos',
    timestamps: true,
  });

  // Asociaciones
  Order.associate = (models) => {
    Order.belongsTo(models.User, { foreignKey: 'usuarioId' });
    Order.belongsToMany(models.Product, { 
      through: models.OrderItem,
      foreignKey: 'orderId'
    });
    Order.hasMany(models.OrderItem, { 
      foreignKey: 'orderId',
      as: 'items'
    });
  };

  return Order;
};