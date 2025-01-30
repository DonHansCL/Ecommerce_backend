// backend/seeders/dummyData.js
const { sequelize, Product, Category, User, Order, OrderItem, Cart, CartItem } = require('../models');
const bcrypt = require('bcrypt');

async function seed() {
  try {
    // 1. Sincronizar la base de datos sin forzar (para evitar pérdida de datos)
    await sequelize.sync({ alter: true }); 

    // 2. Crear Categorías
    const categoriesData = [
      { nombre: 'Ropa', descripcion: 'Moda y vestimenta para todos.' },
      { nombre: 'Hogar', descripcion: 'Productos para el hogar y decoración.' },
      { nombre: 'Deportes', descripcion: 'Equipamiento y accesorios deportivos.' },
    ];

    // Usar findOrCreate para asegurar que cada categoría existe y obtener sus instancias con IDs
    const categories = await Promise.all(
      categoriesData.map(async (category) => {
        const [cat, created] = await Category.findOrCreate({
          where: { nombre: category.nombre },
          defaults: category,
        });
        return cat;
      })
    );

    console.log('Categorías creadas o existentes:', categories.map(cat => ({ nombre: cat.nombre, id: cat.id })));

    // 3. Crear Productos
    const productsData = [
      { nombre: 'Smartphone XYZ', descripcion: 'Último modelo de Smartphone XYZ con características avanzadas.', precio: 699.99, cantidadEnStock: 50, categoriaId: categories[0].id, imagenes: [] },
      { nombre: 'Camisa Casual', descripcion: 'Camisa de algodón para un look casual y cómodo.', precio: 29.99, cantidadEnStock: 200, categoriaId: categories[1].id, imagenes: [] },
      { nombre: 'Sofá Moderno', descripcion: 'Sofá de tres plazas con diseño moderno y materiales de alta calidad.', precio: 499.99, cantidadEnStock: 20, categoriaId: categories[2].id, imagenes: [] },
      { nombre: 'Bicicleta de Montaña', descripcion: 'Bicicleta robusta ideal para senderos de montaña.', precio: 299.99, cantidadEnStock: 30, categoriaId: categories[2].id, imagenes: [] },
    ];

    // Usar bulkCreate con { ignoreDuplicates: true, returning: true } para obtener las instancias creadas
    const products = await Product.bulkCreate(productsData, { ignoreDuplicates: true, returning: true });

    console.log('Productos creados o existentes:', products.map(prod => ({ nombre: prod.nombre, id: prod.id })));

    // 4. Crear Usuarios si no existen
    const [admin] = await User.findOrCreate({
      where: { correo: 'admin@tienda.com' },
      defaults: {
        nombre: 'Admin',
        correo: 'admin@tienda.com',
        contraseña: await bcrypt.hash('admin123', 10),
        rol: 'administrador',
      },
    });

    const [cliente] = await User.findOrCreate({
      where: { correo: 'cliente@tienda.com' },
      defaults: {
        nombre: 'Cliente',
        correo: 'cliente@tienda.com',
        contraseña: await bcrypt.hash('cliente123', 10),
        rol: 'cliente',
      },
    });

    console.log('Usuarios creados o existentes:', [admin, cliente].map(user => ({ nombre: user.nombre, correo: user.correo, id: user.id })));

    // 5. Crear Pedidos vinculados al cliente
    const pedidosData = [
      {
        usuarioId: cliente.id,
        direccionEnvio: 'Calle Falsa 123, Ciudad, País',
        metodoPago: 'tarjeta',
        total: 729.98,
        estado: 'pendiente',
      },
      {
        usuarioId: cliente.id,
        direccionEnvio: 'Avenida Verdadera 456, Ciudad, País',
        metodoPago: 'paypal',
        total: 299.99,
        estado: 'enviado',
      },
    ];

    const pedidos = await Order.bulkCreate(pedidosData, { ignoreDuplicates: true, returning: true });

    console.log('Pedidos creados o existentes:', pedidos.map(order => ({ id: order.id, total: order.total })));

    // 6. Crear PedidoProductos (OrderItems)
    const orderItemsData = [
      {
        orderId: pedidos[0].id,
        productId: products[0].id,
        cantidad: 1,
        precio: products[0].precio,
      },
      {
        orderId: pedidos[0].id,
        productId: products[1].id,
        cantidad: 1,
        precio: products[1].precio,
      },
      {
        orderId: pedidos[1].id,
        productId: products[3].id,
        cantidad: 1,
        precio: products[3].precio,
      },
    ];

    await OrderItem.bulkCreate(orderItemsData, { ignoreDuplicates: true });

    console.log('OrderItems creados o existentes.');

    // 7. Actualizar Stock de Productos según los pedidos
    for (const order of pedidos) {
      const orderItems = await OrderItem.findAll({ where: { orderId: order.id } });
      for (const item of orderItems) {
        const product = await Product.findByPk(item.productId);
        if (product) {  // Asegurarse de que el producto existe
          product.cantidadEnStock -= item.cantidad;
          await product.save();
          console.log(`Stock actualizado para ${product.nombre}: ${product.cantidadEnStock}`);
        }
      }
    }

    // 8. (Opcional) Crear Carrito para el cliente
    // Si deseas crear un carrito inicial para el cliente, puedes descomentar lo siguiente:
    
    const [cart, created] = await Cart.findOrCreate({
      where: { usuarioId: cliente.id },
      defaults: {
        usuarioId: cliente.id,
      },
    });

    console.log(`Carrito ${created ? 'creado' : 'existente'} para el cliente.`);

    await CartItem.bulkCreate([
      {
        carritoId: cart.id,
        productoId: products[2].id,
        cantidad: 2,
      },
    ], { ignoreDuplicates: true });

    console.log('CartItems creados o existentes.');
   

    console.log('Datos dummy insertados exitosamente.');
    process.exit();
  } catch (error) {
    console.error('Error al insertar datos dummy:', error);
    process.exit(1);
  }
}

seed();