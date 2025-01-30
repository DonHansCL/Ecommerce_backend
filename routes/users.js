// filepath: backend/routes/users.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();



/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Operaciones de Autenticación
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - correo
 *               - contraseña
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del usuario
 *               correo:
 *                 type: string
 *                 description: Correo electrónico del usuario
 *               contraseña:
 *                 type: string
 *                 description: Contraseña del usuario
 *               telefono:
 *                 type: string
 *                 description: Teléfono del usuario
 *               direccion:
 *                 type: string
 *                 description: Dirección del usuario
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Error de validación o correo ya en uso
 *       500:
 *         description: Error interno del servidor
 */
    

// Registro de Usuario
router.post('/register', async (req, res) => {
  const { nombre, correo, contraseña, telefono, direccion } = req.body;
  try {
    if (!nombre || !correo || !contraseña || !telefono || !direccion) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const existingUser = await User.findOne({ where: { correo } });
    if (existingUser) {
      return res.status(400).json({ error: 'El correo ya está en uso.' });
    }
    
    const hashedPassword = await bcrypt.hash(contraseña, 10);
    await User.create({
      nombre,
      correo,
      contraseña: hashedPassword,
      telefono,
      direccion,
    });
    res.status(201).json({ message: 'Usuario creado exitosamente' });
  } catch (error) {
    console.error('Error en el registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});



/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión y obtener un token JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *               - contraseña
 *             properties:
 *               correo:
 *                 type: string
 *                 description: Correo electrónico del usuario
 *               contraseña:
 *                 type: string
 *                 description: Contraseña del usuario
 *     responses:
 *       200:
 *         description: Token JWT generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Usuario no encontrado o contraseña incorrecta
 *       500:
 *         description: Error interno del servidor
 */



// Inicio de Sesión
router.post('/login', async (req, res) => {
  const { correo, contraseña } = req.body;
  try {
    const user = await User.findOne({ where: { correo } });
    if (!user) {
      return res.status(400).json({ error: 'Usuario no encontrado o contraseña incorrecta.' });
    }

    const isMatch = await bcrypt.compare(contraseña, user.contraseña);
    if (!isMatch) {
      return res.status(400).json({ error: 'Usuario no encontrado o contraseña incorrecta.' });
    }

    const token = jwt.sign(
      { id: user.id, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});



/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtener todos los usuarios (Solo Administradores)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: Acceso denegado
 *       500:
 *         description: Error al obtener los usuarios
 */


// Obtener Todos los Usuarios (Requiere Autenticación de Administrador)
router.get('/', authMiddleware, async (req, res) => {
  if (req.user.rol !== 'administrador') {
    return res.status(403).json({ error: 'Acceso denegado: No tienes permisos' });
  }

  try {
    const users = await User.findAll({
      attributes: { exclude: ['contraseña'] },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
});


/**
 * @swagger
 * /users/block/{id}:
 *   put:
 *     summary: Bloquear/Desbloquear un usuario (Solo Administradores)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario a bloquear/desbloquear
 *     responses:
 *       200:
 *         description: Estado del usuario actualizado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error al actualizar el usuario
 */


// Bloquear/Desbloquear Usuario (Requiere Autenticación de Administrador)
router.put('/block/:id', authMiddleware, async (req, res) => {
  if (req.user.rol !== 'administrador') {
    return res.status(403).json({ error: 'Acceso denegado: No tienes permisos' });
  }

  const { id } = req.params;
  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Alternar el rol entre 'cliente_bloqueado' y 'cliente'
    user.rol = user.rol === 'cliente' ? 'cliente_bloqueado' : 'cliente';
    await user.save();
    res.json({ message: 'Estado del usuario actualizado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
});



/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Obtener los datos del usuario autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */



router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'nombre', 'correo', 'rol', 'fechaRegistro'],
    });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Error en /me:', error);
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
});

module.exports = router;