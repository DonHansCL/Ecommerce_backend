const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

// Usar DATABASE_URL si está disponible, de lo contrario usar los parámetros individuales
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else {
  sequelize = new Sequelize(`postgres://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/${process.env.DB_NAME}`, {
    dialect: 'postgres',
  });
}

module.exports = sequelize;