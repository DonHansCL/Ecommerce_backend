require('dotenv').config(); // Cargar variables de entorno

const { Sequelize, Op } = require('sequelize');
const { Product, Category } = require('./models'); // Asegúrate de que la ruta sea correcta
const fs = require('fs');
const path = require('path');

// Conexión a la base de datos utilizando variables de entorno
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'postgres', // o el que estés usando
  logging: false,
});

// Función para shufflear un array
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Función principal para duplicar productos
async function duplicateProducts() {
  try {
    await sequelize.authenticate();
    console.log('Conexión establecida con la base de datos.');

    // Leer productos desde el archivo JSON exportado
    const productosData = JSON.parse(fs.readFileSync(path.join(__dirname, 'productos.json'), 'utf-8'));

    for (const producto of productosData) {
      // Determinar cuántas veces deseas duplicar cada producto
      const duplicadosPorProducto = 3; // Por ejemplo, 3 duplicados por producto original

      for (let i = 1; i <= duplicadosPorProducto; i++) {
        // Modificar el nombre del producto
        const nuevoNombre = `${producto.nombre} - Copia ${i}`;

        // Shufflear las imágenes
        const nuevasImagenes = shuffle([...producto.imagenes]);

        // Crear el nuevo producto
        await Product.create({
          nombre: nuevoNombre,
          descripcion: producto.descripcion, // Puedes modificar si lo deseas
          precio: producto.precio, // Puedes modificar si lo deseas
          cantidadEnStock: producto.cantidadEnStock, // Puedes modificar si lo deseas
          categoriaId: producto.categoriaId,
          especificaciones: producto.especificaciones, // Asegúrate de que esté en el formato correcto
          imagenes: nuevasImagenes,
          featured: false, // Puedes establecer según sea necesario
        });

        console.log(`Producto duplicado creado: ${nuevoNombre}`);
      }
    }

    console.log('Duplicación de productos completada.');
    process.exit(0);
  } catch (err) {
    console.error('Error al duplicar productos:', err);
    process.exit(1);
  }
}

duplicateProducts();