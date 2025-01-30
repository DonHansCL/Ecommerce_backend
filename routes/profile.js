// backend/routes/profile.js
const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { User } = require('../models');
const bcrypt = require('bcrypt');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: Operaciones relacionadas con el Perfil de Usuario
 */

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Obtener datos del perfil del usuario
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del perfil del usuario
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */

// Obtener Perfil del Usuario
router.get('/', authMiddleware, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'nombre', 'correo', 'telefono', 'direccion', 'rol', 'fechaRegistro'],
        });
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        res.json({ user });
    } catch (error) {
        console.error('Error al obtener el perfil:', error);
        res.status(500).json({ error: 'Error en el servidor.' });
    }
});

/**
 * @swagger
 * /profile:
 *   put:
 *     summary: Actualizar datos del perfil del usuario
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               telefono:
 *                 type: string
 *               direccion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */

// Actualizar Perfil del Usuario
router.put('/', authMiddleware, async (req, res) => {
    const { nombre, telefono, direccion } = req.body;
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        user.nombre = nombre || user.nombre;
        user.telefono = telefono || user.telefono;
        user.direccion = direccion || user.direccion;

        await user.save();

        res.json({ message: 'Perfil actualizado exitosamente.', user });
    } catch (error) {
        console.error('Error al actualizar el perfil:', error);
        res.status(500).json({ error: 'Error en el servidor.' });
    }
});


/**
 * @swagger
 * /profile/password:
 *   put:
 *     summary: Actualizar la contraseña del usuario
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contraseñaActual
 *               - nuevaContraseña
 *             properties:
 *               contraseñaActual:
 *                 type: string
 *                 description: Contraseña actual del usuario
 *               nuevaContraseña:
 *                 type: string
 *                 description: Nueva contraseña que desea establecer
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 *       400:
 *         description: Contraseña incorrecta o datos inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */

// Actualizar Contraseña del Usuario
router.put('/password', authMiddleware, async (req, res) => {
    const { contraseñaActual, nuevaContraseña } = req.body;
    console.log('Solicitud de cambio de contraseña recibida:', req.user.id);
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            console.log('Usuario no encontrado:', req.user.id);
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        // Verificar contraseña actual
        const isMatch = await bcrypt.compare(contraseñaActual, user.contraseña);
        console.log('Contraseña actual coincide:', isMatch);
        if (!isMatch) {
            return res.status(400).json({ error: 'Contraseña actual incorrecta.' });
        }

        // Validar nueva contraseña
        if (nuevaContraseña.length < 6) {
            return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
        }

        // Hashear nueva contraseña
        const hashedPassword = await bcrypt.hash(nuevaContraseña, 10);
        user.contraseña = hashedPassword;
        await user.save();

        res.json({ message: 'Contraseña actualizada exitosamente.' });
    } catch (error) {
        console.error('Error al actualizar la contraseña:', error);
        res.status(500).json({ error: 'Error en el servidor.' });
    }
});

module.exports = router;