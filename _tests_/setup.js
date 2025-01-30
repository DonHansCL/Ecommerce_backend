const { sequelize } = require('../models');

// Silenciar todos los logs durante las pruebas
console.log = () => {};
sequelize.options.logging = false;

beforeAll(async () => {
  // Sincronizar todas las tablas
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  // Cerrar conexión
  await sequelize.close();
});

// Limpiar todas las tablas antes de cada test
beforeEach(async () => {
  const models = Object.values(sequelize.models);
  for (const model of models) {
    await model.destroy({ where: {}, force: true });
  }
});