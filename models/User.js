// backend/models/User.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    correo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    contraseña: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    telefono: { // New Field
      type: DataTypes.STRING,
      allowNull: true,
    },
    direccion: { // New Field
      type: DataTypes.STRING,
      allowNull: true,
    },
    rol: {
      type: DataTypes.ENUM('cliente', 'administrador', 'cliente_bloqueado'),
      defaultValue: 'cliente',
    },
    fechaRegistro: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'Usuarios',
    timestamps: false,
  });

  // Asociaciones
  User.associate = (models) => {
    User.hasMany(models.Order, { foreignKey: 'usuarioId' });
    User.hasMany(models.Cart, { foreignKey: 'usuarioId' });
  };

  return User;
};