// backend/models/Product.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    especificaciones: {
      type: DataTypes.JSON, 
      allowNull: true,
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    cantidadEnStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    categoriaId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Categorias', 
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    imagenes: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    
  }, {
    tableName: 'Productos',
    timestamps: false,
  });

  // Asociaciones
  Product.associate = (models) => {
    //console.log('Asociando Cart con User, Product y CartItem'); // Log para depuración
    Product.belongsToMany(models.Order, { through: models.OrderItem, foreignKey: 'productId' });
    Product.belongsTo(models.Category, { foreignKey: 'categoriaId' });
    Product.hasMany(models.CartItem, { foreignKey: 'productoId' }); 
    Product.hasMany(models.OrderItem, { foreignKey: 'productId' });
    models.OrderItem.belongsTo(models.Product, { foreignKey: 'productId', as: 'orderItems'  });
  };

  return Product;
};