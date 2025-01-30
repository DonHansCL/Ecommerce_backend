// backend/models/index.js
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;

// Habilitar el logging de Sequelize
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], { 
    ...config,
    logging: console.log, // Habilita el logging
  });
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, { 
    ...config,
    logging: console.log, // Habilita el logging
  });
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 && 
      file !== basename && 
      file.slice(-3) === '.js'
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Definir asociaciones
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Verificar asociaciones
console.log('Asociaciones establecidas:');
Object.keys(db).forEach(modelName => {
  if (db[modelName].associations && Object.keys(db[modelName].associations).length > 0) {
    console.log(`${modelName}:`, Object.keys(db[modelName].associations));
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;