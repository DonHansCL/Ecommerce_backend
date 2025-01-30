const request = require('supertest');
const app = require('../server');
const { Order } = require('../models');

describe('Order Routes', () => {
  it('should get user orders', async () => {
    const res = await request(app).get('/api/pedidos'); // Changed from /api/orders
    expect(res.statusCode).toBe(401);
  });
});