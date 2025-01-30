// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/authMiddleware');
const { User } = require('../models');
const router = express.Router();


/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Operaciones de Autenticación
 */

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


// Ruta para iniciar sesión y obtener el token
router.post('/login', async (req, res) => {
  const { correo, contraseña } = req.body;
  try {
    const user = await User.findOne({ where: { correo } });
    if (!user) {
      return res.status(400).json({ error: 'Usuario no encontrado.' });
    }

    const isMatch = await bcrypt.compare(contraseña, user.contraseña);
    if (!isMatch) {
      return res.status(400).json({ error: 'Contraseña incorrecta.' });
    }

    const token = jwt.sign(
      { id: user.id, rol: user.rol },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ error: 'Error en el servidor.' });
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


// Ruta para obtener los datos del usuario autenticado
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'nombre', 'correo', 'telefono', 'direccion', 'rol'],
    });
    res.json({ user });
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    res.status(500).json({ error: 'Error en el servidor.' });
  }
});

module.exports = router;