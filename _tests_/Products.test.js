const request = require('supertest');
const app = require('../server');
const { Product } = require('../models');

describe('Product Routes', () => {
  it('should get all products', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
  });
});