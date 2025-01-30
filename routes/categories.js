const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Category, Product } = require('../models');
const authMiddleware = require('../middlewares/authMiddleware');
const { Op } = require('sequelize');
const router = express.Router();



/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Operaciones relacionadas con Categorías
 */


// Configuración de Multer para manejar imágenes de categorías
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'categories');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtrar solo archivos de imagen
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

const upload = multer({ storage, fileFilter });



/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Obtener todas las categorías
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Lista de categorías
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *       500:
 *         description: Error al obtener las categorías
 */


// Obtener Todas las Categorías
router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (error) {
    console.error('Error al obtener las categorías:', error); // Log detallado
    res.status(500).json({ 
      error: 'Error al obtener las categorías',
      details: error.message // Envía detalles del error al frontend
    });
  }
});



/**
 * @swagger
 * /categories/{categoriaId}/products:
 *   get:
 *     summary: Obtener productos de una categoría específica con opcional límite y exclusión de un producto
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: categoriaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la categoría
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Número máximo de productos a retornar
 *       - in: query
 *         name: exclude
 *         schema:
 *           type: integer
 *         description: ID del producto a excluir de los resultados
 *     responses:
 *       200:
 *         description: Lista de productos relacionados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       500:
 *         description: Error al obtener los productos relacionados
 */

// Obtener Productos Relacionados en una Categoría, Excluyendo un Producto y con Límite
router.get('/:categoriaId/products', async (req, res) => {
  try {
    const { categoriaId } = req.params;
    const { limit = 4, exclude } = req.query; // Default limit = 4

    // Validar que categoriaId es un número
    if (isNaN(categoriaId)) {
      return res.status(400).json({ message: 'categoriaId debe ser un número.' });
    }

    // Si 'exclude' está presente, validarlo
    if (exclude && isNaN(exclude)) {
      return res.status(400).json({ message: 'exclude debe ser un número.' });
    }

    // Construir la cláusula WHERE
    const whereClause = {
      categoriaId: categoriaId
    };

    if (exclude) {
      whereClause.id = { [Op.ne]: exclude };
    }

    const productos = await Product.findAll({
      where: whereClause,
      limit: parseInt(limit),
      order: [['nombre', 'ASC']],
      include: [{ model: Category, attributes: ['nombre'] }]
    });

    res.status(200).json(productos);
  } catch (err) {
    console.error('Error al obtener productos relacionados:', err);
    res.status(500).json({ message: 'Error al obtener productos relacionados.', error: err.message });
  }
});



/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Crear una nueva categoría (Solo Administradores)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre de la categoría
 *               descripcion:
 *                 type: string
 *                 description: Descripción de la categoría
 *               imagen:
 *                 type: string
 *                 format: binary
 *                 description: Imagen de la categoría
 *     responses:
 *       201:
 *         description: Categoría creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       403:
 *         description: Acceso denegado
 *       400:
 *         description: Error de validación
 *       500:
 *         description: Error al crear la categoría
 */


// Crear una Nueva Categoría (Requiere Autenticación de Administrador)
router.post('/', authMiddleware, upload.single('imagen'), async (req, res) => {
  // Verificar si el usuario es administrador
  if (req.user.rol !== 'administrador') {
    return res.status(403).json({ error: 'Acceso denegado: No tienes permisos' });
  }

  const { nombre, descripcion } = req.body;
  let imagen = null;
  if (req.file) {
    imagen = req.file.filename;
  }

  try {
    const category = await Category.create({ nombre, descripcion, imagen });
    res.status(201).json(category);
  } catch (error) {
    console.error('Error al crear la categoría:', error); // Log detallado
    res.status(400).json({ 
      error: 'Error al crear la categoría',
      details: error.message 
    });
  }
});



/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Actualizar una categoría existente (Solo Administradores)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la categoría a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre de la categoría
 *               descripcion:
 *                 type: string
 *                 description: Descripción de la categoría
 *               imagen:
 *                 type: string
 *                 format: binary
 *                 description: Nueva imagen de la categoría
 *     responses:
 *       200:
 *         description: Categoría actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Categoría no encontrada
 *       400:
 *         description: Error de validación
 *       500:
 *         description: Error al actualizar la categoría
 */



// Actualizar una Categoría (Requiere Autenticación de Administrador)
router.put('/:id', authMiddleware, upload.single('imagen'), async (req, res) => {
  // Verificar si el usuario es administrador
  if (req.user.rol !== 'administrador') {
    return res.status(403).json({ error: 'Acceso denegado: No tienes permisos' });
  }

  const { id } = req.params;
  const { nombre, descripcion } = req.body;
  try {
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // Si se sube una nueva imagen, actualizar el campo 'imagen'
    if (req.file) {
      category.imagen = req.file.filename;
    }

    category.nombre = nombre || category.nombre;
    category.descripcion = descripcion || category.descripcion;

    await category.save();
    res.json(category);
  } catch (error) {
    console.error('Error al actualizar la categoría:', error); // Log detallado
    res.status(400).json({ 
      error: 'Error al actualizar la categoría',
      details: error.message 
    });
  }
});


/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Eliminar una categoría existente (Solo Administradores)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la categoría a eliminar
 *     responses:
 *       200:
 *         description: Categoría eliminada exitosamente
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Categoría no encontrada
 *       500:
 *         description: Error al eliminar la categoría
 */


// Eliminar una Categoría (Requiere Autenticación de Administrador)
router.delete('/:id', authMiddleware, async (req, res) => {
  // Verificar si el usuario es administrador
  if (req.user.rol !== 'administrador') {
    return res.status(403).json({ error: 'Acceso denegado: No tienes permisos' });
  }

  const { id } = req.params;
  try {
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    await category.destroy();
    res.json({ message: 'Categoría eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar la categoría:', error); // Log detallado
    res.status(500).json({ 
      error: 'Error al eliminar la categoría',
      details: error.message 
    });
  }
});

// Middleware de manejo de errores de Multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Error de Multer
    return res.status(400).json({ error: err.message });
  } else if (err) {
    // Otros errores
    return res.status(500).json({ error: err.message });
  }
  next();
});

module.exports = router;