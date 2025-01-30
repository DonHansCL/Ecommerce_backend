// backend/_tests_/Cart.test.js

const request = require('supertest');
const app = require('../server');
const { User, Product, Cart, CartItem } = require('../models');

describe('Cart Routes', () => {
  let token;
  let testProduct;

  beforeEach(async () => {
    // Limpiar las tablas relevantes
    await CartItem.destroy({ where: {} });
    await Cart.destroy({ where: {} });
    await Product.destroy({ where: {} });
    await User.destroy({ where: {} });

    // Crear usuario de prueba
    const userRes = await request(app)
      .post('/api/users/register')
      .send({
        nombre: 'Cart Test User',
        correo: 'cart@test.com',
        contraseña: 'test123',
        telefono: '1234567890',
        direccion: 'Test Address'
      });

    // Iniciar sesión para obtener el token
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({
        correo: 'cart@test.com',
        contraseña: 'test123'
      });

    token = loginRes.body.token;

    // Crear producto de prueba
    testProduct = await Product.create({
      nombre: 'Test Product',
      descripcion: 'Test Description',
      precio: 99.99,
      cantidadEnStock: 10,
      categoriaId: null // Asigna una categoría si es necesario
    });
  });

  it('should add product to cart', async () => {
    const res = await request(app)
      .post('/api/carts/add')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productoId: testProduct.id,
        cantidad: 1
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Producto agregado al carrito');
  });

  it('should get cart contents', async () => {
    // Primero, agregar un producto al carrito
    await request(app)
      .post('/api/carts/add')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productoId: testProduct.id,
        cantidad: 1
      });

    const res = await request(app)
      .get('/api/carts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('cartItems');
    expect(Array.isArray(res.body.cartItems)).toBeTruthy();
    expect(res.body.cartItems.length).toBeGreaterThan(0);
    expect(res.body.cartItems[0]).toHaveProperty('cantidad', 1);
    expect(res.body.cartItems[0].product).toHaveProperty('nombre', 'Test Product');
  });

  afterEach(async () => {
    await CartItem.destroy({ where: {} });
    await Cart.destroy({ where: {} });
    await Product.destroy({ where: {} });
    await User.destroy({ where: {} });
  });
});