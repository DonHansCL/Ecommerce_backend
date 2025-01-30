const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Category = sequelize.define('Category', {
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
    },
    imagen: {
      type: DataTypes.STRING, 
      allowNull: true, 
    },
  }, {
    tableName: 'Categorias',
    timestamps: false,
  });

  Category.associate = (models) => {
    Category.hasMany(models.Product, { foreignKey: 'categoriaId' });
  };

  return Category;
};