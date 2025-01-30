// backend/routes/orders.js
const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { Cart, CartItem, Order, Product, User, OrderItem, sequelize } = require('../models'); // Asegúrate de importar OrderItem
const router = express.Router();



/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Operaciones relacionadas con Pedidos
 */

/**
 * @swagger
 * /orders/checkout:
 *   post:
 *     summary: Realizar checkout y crear un pedido
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - direccionEnvio
 *               - metodoPago
 *             properties:
 *               direccionEnvio:
 *                 type: string
 *                 description: Dirección de envío
 *               metodoPago:
 *                 type: string
 *                 description: Método de pago (ej. tarjeta, paypal)
 *     responses:
 *       201:
 *         description: Pedido creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Carrito vacío o datos inválidos
 *       500:
 *         description: Error al procesar el pedido
 */



// Realizar Checkout y Crear Pedido
router.post('/checkout', authMiddleware, async (req, res) => {
  const { direccionEnvio, metodoPago } = req.body;
  const t = await sequelize.transaction();

  try {
    // 1. Get cart with items
    const cart = await Cart.findOne({
      where: { usuarioId: req.user.id },
      include: [{
        model: CartItem,
        include: [{ 
          model: Product,
          as: 'product'
        }]
      }],
      transaction: t
    });

    console.log('Cart retrieved:', JSON.stringify(cart, null, 2));

    if (!cart || !cart.CartItems || cart.CartItems.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'El carrito está vacío' });
    }

    // 2. Calculate total
    let total = cart.CartItems.reduce((sum, item) => {
      return sum + (parseFloat(item.product.precio) * item.cantidad);
    }, 0);

    console.log('Total calculated:', total);

    // 3. Crear pedido
    const order = await Order.create({
      usuarioId: req.user.id,
      total: total,
      direccionEnvio,
      metodoPago,
      estado: 'pendiente'
    }, { transaction: t });

    console.log('Order created:', order.toJSON());

    // 4. Crear ítems del pedido
    for (const cartItem of cart.CartItems) {
      console.log('Creating OrderItem for product:', cartItem.product.id);
      await OrderItem.create({
        orderId: order.id,
        productId: cartItem.product.id, // Correct field name
        cantidad: cartItem.cantidad,
        precio: cartItem.product.precio
      }, { transaction: t });
    }

    // 5. Limpiar carrito
    await CartItem.destroy({
      where: { carritoId: cart.id },
      transaction: t
    });

    // 6. Confirmar transacción
    await t.commit();

    // 7. Obtener el pedido con sus ítems para enviarlo al frontend
    const createdOrder = await Order.findOne({
      where: { id: order.id },
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{ model: Product, as: 'product' }]
      }],
    });

    console.log('Created Order with Items:', JSON.stringify(createdOrder, null, 2));

    res.status(201).json({
      message: 'Pedido creado exitosamente',
      order: createdOrder
    });

  } catch (error) {
    await t.rollback();
    console.error('Error en checkout:', error);
    res.status(500).json({
      error: 'Error al procesar el pedido',
      details: error.message
    });
  }
});



/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Obtener historial de pedidos
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pedidos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       403:
 *         description: Acceso denegado
 *       500:
 *         description: Error al obtener los pedidos
 */



// Obtener Historial de Pedidos del Usuario o Todos si es Admin
router.get('/', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { usuarioId: req.user.id },
      include: [
        {
          model: User,
          attributes: ['nombre', 'correo']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'nombre', 'precio', 'imagenes']
          }]
        }
      ],
      order: [['id', 'DESC']]
    });

    res.json(orders);
  } catch (error) {
    console.error('Error al obtener los pedidos:', error);
    res.status(500).json({ 
      error: 'Error al obtener los pedidos', 
      details: error.message 
    });
  }
});


/**
 * Obtener Todos los Pedidos (Solo para Administradores)
 */
router.get('/all', authMiddleware, async (req, res) => {
  try {
    // Verificar si el usuario es administrador
    if (req.user.rol !== 'administrador') {
      return res.status(403).json({ error: 'Acceso denegado.' });
    }

    const orders = await Order.findAll({
      include: [
        {
          model: User,
          attributes: ['nombre', 'correo']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'nombre', 'precio', 'imagenes']
          }]
        }
      ],
      order: [['id', 'DESC']]
    });

    res.json(orders);
  } catch (error) {
    console.error('Error al obtener todos los pedidos:', error);
    res.status(500).json({ 
      error: 'Error al obtener todos los pedidos', 
      details: error.message 
    });
  }
});


router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    // Validate status
    const validStatus = ['pendiente', 'enviado', 'entregado', 'cancelado'];
    if (!validStatus.includes(estado.toLowerCase())) {
      return res.status(400).json({ error: 'Estado no válido' });
    }

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    order.estado = estado.toLowerCase();
    await order.save();

    res.json(order);
  } catch (error) {
    console.error('Error al actualizar el estado:', error);
    res.status(500).json({ 
      error: 'Error al actualizar el estado',
      details: error.message 
    });
  }
});

module.exports = router;