// backend/_tests_/Auth.test.js

const request = require('supertest');
const app = require('../server');
const { User } = require('../models');

describe('Auth Routes', () => {
  beforeAll(async () => {
    await User.destroy({ where: {} });
  });

  afterAll(async () => {
    await User.destroy({ where: {} });
  });

  describe('Register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          nombre: 'Test User',
          correo: 'test@test.com',
          contraseña: 'test123',
          telefono: '1234567890',
          direccion: 'Test Address'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('message', 'Usuario creado exitosamente');
    });

    it('should not allow duplicate email', async () => {
      // Registrar el primer usuario
      await request(app)
        .post('/api/users/register')
        .send({
          nombre: 'Test User',
          correo: 'duplicate@test.com',
          contraseña: 'test123',
          telefono: '1234567890',
          direccion: 'Test Address'
        });

      // Intentar registrar el segundo usuario con el mismo correo
      const res = await request(app)
        .post('/api/users/register')
        .send({
          nombre: 'Test User 2',
          correo: 'duplicate@test.com',
          contraseña: 'test123',
          telefono: '1234567890',
          direccion: 'Test Address'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'El correo ya está en uso.');
    });
  });

  describe('Login', () => {
    it('should login successfully', async () => {
      // Registrar el usuario antes de intentar iniciar sesión
      await request(app)
        .post('/api/users/register')
        .send({
          nombre: 'Login User',
          correo: 'login@test.com',
          contraseña: 'test123',
          telefono: '1234567890',
          direccion: 'Test Address'
        });

      const res = await request(app)
        .post('/api/users/login')
        .send({
          correo: 'login@test.com',
          contraseña: 'test123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should not login with incorrect password', async () => {
      // Registrar el usuario antes de intentar iniciar sesión
      await request(app)
        .post('/api/users/register')
        .send({
          nombre: 'Login User',
          correo: 'invalidlogin@test.com',
          contraseña: 'test123',
          telefono: '1234567890',
          direccion: 'Test Address'
        });

      const res = await request(app)
        .post('/api/users/login')
        .send({
          correo: 'invalidlogin@test.com',
          contraseña: 'wrongpassword'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Usuario no encontrado o contraseña incorrecta.');
    });
  });
});