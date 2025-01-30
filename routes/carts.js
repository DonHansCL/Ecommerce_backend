const express = require('express');
const { Cart, CartItem, Product } = require('../models');;
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

// Helper para decodificar token
const decodeToken = (token) => {
  const jwt = require('jsonwebtoken');
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
  } catch (error) {
    return null;
  }
};


/**
 * @swagger
 * tags:
 *   name: Carts
 *   description: Operaciones relacionadas con Carritos
 */

/**
 * @swagger
 * /carts:
 *   get:
 *     summary: Obtener el carrito del usuario
 *     tags: [Carts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Detalles del carrito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cartItems:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       cantidad:
 *                         type: integer
 *                       product:
 *                         $ref: '#/components/schemas/Product'
 *       500:
 *         description: Error al obtener el carrito
 */



// Obtener el Carrito del Usuario (Requiere Autenticación)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let cart = await Cart.findOne({
      where: { usuarioId: req.user.id },
      include: {
        model: CartItem,
        include: [{ model: Product, as: 'product' }],
      },
    });

    if (!cart) {
      return res.status(200).json({ message: 'Carrito está vacío', cartItems: [] });
    }

    res.json({ cartItems: cart.CartItems });
  } catch (error) {
    console.error('Error al obtener el carrito:', error.stack);
    res.status(500).json({ error: 'Error al obtener el carrito' });
  }
});


/**
 * @swagger
 * /carts/add:
 *   post:
 *     summary: Agregar un producto al carrito
 *     tags: [Carts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productoId
 *               - cantidad
 *             properties:
 *               productoId:
 *                 type: integer
 *                 description: ID del producto a agregar
 *               cantidad:
 *                 type: integer
 *                 description: Cantidad del producto
 *     responses:
 *       200:
 *         description: Producto agregado al carrito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 cartItem:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     carritoId:
 *                       type: integer
 *                     productoId:
 *                       type: integer
 *                     cantidad:
 *                       type: integer
 *       400:
 *         description: Producto o cantidad inválida
 *       500:
 *         description: Error al agregar al carrito
 */



// Agregar un Producto al Carrito
router.post('/add', authMiddleware, async (req, res) => {
  const { productoId, cantidad } = req.body;

  if (!productoId || cantidad < 1) {
    return res.status(400).json({ error: 'Producto y cantidad son requeridos' });
  }

  try {
    const product = await Product.findByPk(productoId);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    let cart = await Cart.findOne({ where: { usuarioId: req.user.id } });
    if (!cart) {
      cart = await Cart.create({ usuarioId: req.user.id });
    }

    const [cartItem, created] = await CartItem.findOrCreate({
      where: { carritoId: cart.id, productoId },
      defaults: { cantidad },
    });

    if (!created) {
      cartItem.cantidad += cantidad;
      await cartItem.save();
      console.log(`Cantidad actualizada para el producto: ID ${productoId}, Nueva cantidad: ${cartItem.cantidad}`);
    } else {
      console.log(`Producto agregado al carrito: ID ${productoId}, Cantidad: ${cantidad}`);
    }

    res.status(200).json({ message: 'Producto agregado al carrito', cartItem });
  } catch (error) {
    console.error('Error al agregar al carrito:', error.stack);
    res.status(500).json({ error: 'Error al agregar al carrito' });
  }
});



/**
 * @swagger
 * /carts/update:
 *   put:
 *     summary: Actualizar la cantidad de un producto en el carrito
 *     tags: [Carts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productoId
 *               - cantidad
 *             properties:
 *               productoId:
 *                 type: integer
 *                 description: ID del producto a actualizar
 *               cantidad:
 *                 type: integer
 *                 description: Nueva cantidad del producto
 *     responses:
 *       200:
 *         description: Cantidad actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 cartItem:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     cantidad:
 *                       type: integer
 *       400:
 *         description: Producto o cantidad inválida
 *       404:
 *         description: Producto no encontrado en el carrito
 *       500:
 *         description: Error al actualizar la cantidad
 */



// Actualizar la Cantidad de un Producto en el Carrito (Requiere Autenticación)
router.put('/update', authMiddleware, async (req, res) => {
  const { productoId, cantidad } = req.body;

  if (!productoId || cantidad < 1) {
    return res.status(400).json({ error: 'Producto y cantidad son requeridos' });
  }

  try {
    const cart = await Cart.findOne({ where: { usuarioId: req.user.id } });
    if (!cart) {
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }

    const cartItem = await CartItem.findOne({
      where: {
        carritoId: cart.id,
        productoId: productoId,
      },
      include: [{ model: Product, as: 'product' }],
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Producto no encontrado en el carrito' });
    }

    cartItem.cantidad = cantidad;
    await cartItem.save();

    res.status(200).json({ message: 'Cantidad actualizada', cartItem });
  } catch (error) {
    console.error('Error al actualizar la cantidad:', error.stack); // Log detallado
    res.status(500).json({ error: 'Error al actualizar la cantidad' });
  }
});



/**
 * @swagger
 * /carts/remove/{productoId}:
 *   delete:
 *     summary: Eliminar un producto del carrito
 *     tags: [Carts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto a eliminar
 *     responses:
 *       200:
 *         description: Producto eliminado del carrito
 *       404:
 *         description: Producto no encontrado en el carrito
 *       500:
 *         description: Error al eliminar el producto
 */



// Eliminar un Producto del Carrito (Requiere Autenticación)
router.delete('/remove/:productoId', authMiddleware, async (req, res) => {
  const { productoId } = req.params;

  try {
    const cart = await Cart.findOne({ where: { usuarioId: req.user.id } });
    if (!cart) {
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }

    const cartItem = await CartItem.findOne({
      where: {
        carritoId: cart.id,
        productoId: productoId,
      },
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Producto no encontrado en el carrito' });
    }
    await cartItem.destroy();
    res.status(200).json({ message: 'Producto eliminado del carrito' });
  } catch (error) {
    console.error('Error al eliminar del carrito:', error.stack); // Log detallado
    res.status(500).json({ error: 'Error al eliminar el producto del carrito' });
  }
});


/**
 * @swagger
 * /carts/clear:
 *   post:
 *     summary: Limpiar el carrito completo
 *     tags: [Carts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carrito limpiado exitosamente
 *       500:
 *         description: Error al limpiar el carrito
 */



// Limpiar el Carrito (Requiere Autenticación)
router.post('/clear', authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ where: { usuarioId: req.user.id } });
    if (!cart) {
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }

    await CartItem.destroy({ where: { carritoId: cart.id } });
    res.status(200).json({ message: 'Carrito limpiado' });
  } catch (error) {
    console.error('Error al limpiar el carrito:', error.stack); // Log detallado
    res.status(500).json({ error: 'Error al limpiar el carrito' });
  }
});

module.exports = router;