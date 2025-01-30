const request = require('supertest');
const app = require('../server');
const { Category } = require('../models');

describe('Category Routes', () => {
  beforeEach(async () => {
    await Category.destroy({ where: {} });
    // Crear categoría de prueba antes de cada test
    await Category.create({
      nombre: 'Test Category',
      descripcion: 'Test Description'
    });
  });

  it('should get all categories', async () => {
    const res = await request(app)
      .get('/api/categories');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('nombre', 'Test Category');
  });
});