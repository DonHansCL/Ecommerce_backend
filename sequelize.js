const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(`postgres://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/${process.env.DB_NAME}`, {
  dialect: 'postgres',
});

module.exports = sequelize;