// backend/routes/products.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { Product, Category } = require('../models');
const authMiddleware = require('../middlewares/authMiddleware');
const { Op, fn, col, where } = require('sequelize');


/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Operaciones relacionadas con Productos
 */


// Configuración de Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Carpeta donde se almacenarán las imágenes
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Nombre único para evitar conflictos
  }
});

const fileFilter = (req, file, cb) => {
  // Aceptar solo archivos de imagen
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limitar a 5MB por archivo
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif).'));
  }
});



/**
 * @swagger
 * /products:
 *   get:
 *     summary: Obtener todos los productos con opcional filtro por categoría o destacados
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *         description: Nombre de la categoría para filtrar productos
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filtrar productos destacados
 *     responses:
 *       200:
 *         description: Lista de productos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       500:
 *         description: Error al obtener los productos
 */


// Obtener Todos los Productos con Opcional Filtro por Categoría
router.get('/', async (req, res) => {
  try {
    const { search, categoria, featured } = req.query;
    const whereClause = {};

    if (search) {
      whereClause.nombre = where(
        fn('unaccent', col('Product.nombre')), // Especificar la tabla para evitar ambigüedad
        {
          [Op.iLike]: `%${search}%`, // Búsqueda insensible a mayúsculas/minúsculas y acentos
        }
      );
    }

    if (categoria) {
      const category = await Category.findOne({ where: { id: categoria } });
      if (category) {
        whereClause.categoriaId = categoria;
      }
    }

    if (featured) {
      whereClause.featured = featured === 'true';
    }

    const productos = await Product.findAll({
      where: whereClause,
      include: [{ model: Category, attributes: ['nombre'] }], // Incluir la categoría
    });

    res.status(200).json(productos);
  } catch (err) {
    console.error('Error al obtener los productos:', err);
    res.status(500).json({ message: 'Error al obtener los productos.', error: err.message });
  }
});


//Ruta GET temporal para obtener todos los productos
// router.get('/export', async (req, res) => {
//   try {
//     // Verificar si el usuario es administrador
    

//     const productos = await Product.findAll({
//       include: [{ model: Category, attributes: ['nombre'] }],
//     });

//     res.json(productos);
//   } catch (err) {
//     console.error('Error al exportar productos:', err);
//     res.status(500).json({ error: 'Error al exportar productos.', details: err.message });
//   }
// });




/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Obtener detalles de un producto por ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Detalles del producto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error al obtener el producto
 */


// Obtener Detalles de un Producto por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id, {
      include: [Category],
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el producto.' });
  }
});



/**
 * @swagger
 * /products:
 *   post:
 *     summary: Crear un nuevo producto (Solo Administradores)
 *     tags: [Products]
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
 *               - precio
 *               - cantidadEnStock
 *               - categoriaId
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del producto
 *               descripcion:
 *                 type: string
 *                 description: Descripción del producto
 *               precio:
 *                 type: number
 *                 format: float
 *                 description: Precio del producto
 *               cantidadEnStock:
 *                 type: integer
 *                 description: Cantidad en stock
 *               categoriaId:
 *                 type: integer
 *                 description: ID de la categoría
 *               imagenes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Imágenes del producto
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       403:
 *         description: Acceso denegado
 *       400:
 *         description: Error de validación
 *       500:
 *         description: Error al crear el producto
 */



// Crear un Nuevo Producto (Requiere Autenticación de Administrador)
router.post('/', authMiddleware, upload.array('imagenes', 5), async (req, res) => {
  try {
    // Verificar si el usuario es administrador
    if (req.user.rol !== 'administrador') {
      return res.status(403).json({ error: 'Acceso denegado: No tienes permisos' });
    }

    const { nombre, descripcion, precio, cantidadEnStock, categoriaId, especificaciones, featured } = req.body;
    const imagenes = req.files.map(file => file.path); // Obtener las rutas de las imágenes

    // Validaciones
    if (!nombre || !descripcion || !precio || !cantidadEnStock || !categoriaId) {
      return res.status(400).json({ error: 'Todos los campos son requeridos.' });
    }

    const category = await Category.findByPk(categoriaId);
    if (!category) {
      return res.status(400).json({ error: 'Categoría inválida' });
    }

    // Parsear especificaciones
    let specs = {};
    if (especificaciones) {
      try {
        specs = JSON.parse(especificaciones);
      } catch (err) {
        return res.status(400).json({ message: 'Especificaciones inválidas. Debe ser un JSON válido.' });
      }
    }

    const product = await Product.create({
      nombre,
      descripcion,
      precio,
      imagenes,
      cantidadEnStock,
      categoriaId,
      especificaciones: specs,
      featured: featured === 'true',
    });
    res.status(201).json(product);
  } catch (error) {
    console.error(error); // Log detallado del error
    res.status(400).json({ error: error.message || 'Error al crear el producto' });
  }
});



/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Actualizar un producto existente (Solo Administradores)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del producto
 *               descripcion:
 *                 type: string
 *                 description: Descripción del producto
 *               precio:
 *                 type: number
 *                 format: float
 *                 description: Precio del producto
 *               cantidadEnStock:
 *                 type: integer
 *                 description: Cantidad en stock
 *               categoriaId:
 *                 type: integer
 *                 description: ID de la categoría
 *               especificaciones:
 *                 type: string
 *                 description: Especificaciones del producto en formato JSON
 *               eliminarImagenes:
 *                 type: string
 *                 description: Array de rutas de imágenes a eliminar en formato JSON
 *               imagenes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Nuevas imágenes del producto
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Producto no encontrado
 *       400:
 *         description: Error de validación
 *       500:
 *         description: Error al actualizar el producto
 */


// Actualizar un Producto Existente (Solo Administradores)
router.put('/:id', authMiddleware, upload.array('imagenes', 5), async (req, res) => {
  try {
    if (req.user.rol !== 'administrador') {
      return res.status(403).json({ error: 'Acceso denegado.' });
    }

    const { id } = req.params;
    const { nombre, descripcion, precio, cantidadEnStock, categoriaId, especificaciones, imagenesAEliminar, featured, imagenesExistentes } = req.body;

    const producto = await Product.findByPk(id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    // Validaciones básicas
    if (!nombre || !precio || cantidadEnStock == null || !categoriaId) {
      return res.status(400).json({ error: 'Todos los campos son requeridos.' });
    }

    // Verificar si la categoría existe
    const categoria = await Category.findByPk(categoriaId);
    if (!categoria) {
      return res.status(404).json({ error: 'Categoría no encontrada.' });
    }

    // Actualizar los campos del producto
    producto.nombre = nombre;
    producto.descripcion = descripcion; // Asegúrate de que la descripción sea manejada correctamente
    producto.precio = precio;
    producto.cantidadEnStock = cantidadEnStock;
    producto.categoriaId = categoriaId;
    producto.featured = featured !== undefined ? (featured === 'true') : producto.featured;
    
    // Parsear especificaciones
    if (especificaciones) {
      try {
        producto.especificaciones = JSON.parse(especificaciones);
      } catch (err) {
        return res.status(400).json({ message: 'Especificaciones inválidas. Debe ser un JSON válido.' });
      }
    }

    // Manejar nuevas imágenes
    if (req.files && req.files.length > 0) {
      const nuevasImagenes = req.files.map(file => file.path.replace(/\\/g, '/')); // Asegura rutas consistentes
      producto.imagenes = producto.imagenes.concat(nuevasImagenes);
    }

    // Manejar imágenes a eliminar
    if (req.body.imagenesAEliminar) {
      let imagenesAEliminar;
      try {
        imagenesAEliminar = JSON.parse(req.body.imagenesAEliminar);
      } catch (parseError) {
        return res.status(400).json({ error: 'Formato inválido para eliminar imágenes.' });
      }

      // Filtrar las imágenes existentes para eliminar las especificadas
      producto.imagenes = producto.imagenes.filter(img => !imagenesAEliminar.includes(img));

      // Eliminar archivos del servidor
      imagenesAEliminar.forEach(imgPath => {
        const fullPath = path.join(__dirname, '..', imgPath);
        fs.unlink(fullPath, (err) => {
          if (err) console.error(`Error al eliminar la imagen ${imgPath}:`, err);
        });
      });
    }

    // Reordenar imágenes existentes
    if (imagenesExistentes) {
      const existingImages = JSON.parse(imagenesExistentes);
      producto.imagenes = existingImages.concat(producto.imagenes.filter(img => !existingImages.includes(img)));
    }

    await producto.save();

    res.json(producto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el producto.' });
  }
});



/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Eliminar un producto (Solo Administradores)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto a eliminar
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error al eliminar el producto
 */


// Eliminar un Producto (Requiere Autenticación de Administrador)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.rol !== 'administrador') {
      return res.status(403).json({ error: 'Acceso denegado: No tienes permisos' });
    }

    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Eliminar imágenes del sistema de archivos
    if (product.imagenes && product.imagenes.length > 0) {
      product.imagenes.forEach(imgPath => {
        fs.unlink(imgPath, (err) => {
          if (err) {
            console.error(`Error al eliminar la imagen ${imgPath}:`, err);
          }
        });
      });
    }

    await product.destroy();
    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error(error); // Log detallado del error
    res.status(500).json({ error: 'Error al eliminar el producto' });
  }
});


module.exports = router;