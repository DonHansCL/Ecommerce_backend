const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Ecommerce',
      version: '1.0.0',
      description: 'Documentación de la API para la tienda Ecommerce',
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Servidor de Desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // Esquema de Usuario
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del usuario',
              example: 1,
            },
            nombre: {
              type: 'string',
              description: 'Nombre del usuario',
              example: 'Juan Pérez',
            },
            correo: {
              type: 'string',
              description: 'Correo electrónico del usuario',
              example: 'juan.perez@example.com',
            },
            rol: {
              type: 'string',
              description: 'Rol del usuario (ej. cliente, administrador)',
              example: 'cliente',
            },
            fechaRegistro: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de registro del usuario',
              example: '2023-10-01T12:34:56.789Z',
            },
          },
        },
        // Esquema de Categoría
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único de la categoría',
              example: 1,
            },
            nombre: {
              type: 'string',
              description: 'Nombre de la categoría',
              example: 'Electrónica',
            },
            descripcion: {
              type: 'string',
              description: 'Descripción de la categoría',
              example: 'Productos electrónicos y gadgets.',
            },
            imagen: {
              type: 'string',
              description: 'Nombre del archivo de imagen de la categoría',
              example: 'electronics.jpg',
            },
          },
        },
        // Esquema de Producto
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del producto',
              example: 1,
            },
            nombre: {
              type: 'string',
              description: 'Nombre del producto',
              example: 'Smartphone XYZ',
            },
            descripcion: {
              type: 'string',
              description: 'Descripción del producto',
              example: 'Smartphone de última generación con múltiples funcionalidades.',
            },
            precio: {
              type: 'number',
              format: 'float',
              description: 'Precio del producto',
              example: 299.99,
            },
            cantidadEnStock: {
              type: 'integer',
              description: 'Cantidad disponible en stock',
              example: 50,
            },
            categoriaId: {
              type: 'integer',
              description: 'ID de la categoría a la que pertenece el producto',
              example: 1,
            },
            imagenes: {
              type: 'array',
              items: {
                type: 'string',
                description: 'Nombre de archivo de las imágenes del producto',
                example: 'smartphone1.jpg',
              },
            },
            featured: {
              type: 'boolean',
              description: 'Indica si el producto es destacado',
              example: true,
            },
          },
        },
        // Esquema de OrderItem
        OrderItem: {
          type: 'object',
          properties: {
            orderId: {
              type: 'integer',
              description: 'ID del pedido',
              example: 1,
            },
            productId: {
              type: 'integer',
              description: 'ID del producto',
              example: 1,
            },
            cantidad: {
              type: 'integer',
              description: 'Cantidad de productos en el pedido',
              example: 2,
            },
            precio: {
              type: 'number',
              format: 'float',
              description: 'Precio del producto al momento del pedido',
              example: 299.99,
            },
          },
        },
        // Esquema de Orden
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del pedido',
              example: 1,
            },
            usuarioId: {
              type: 'integer',
              description: 'ID del usuario que realizó el pedido',
              example: 1,
            },
            total: {
              type: 'number',
              format: 'float',
              description: 'Total del pedido',
              example: 599.98,
            },
            direccionEnvio: {
              type: 'string',
              description: 'Dirección de envío',
              example: 'Calle Falsa 123, Ciudad, País',
            },
            metodoPago: {
              type: 'string',
              description: 'Método de pago utilizado',
              example: 'tarjeta',
            },
            estado: {
              type: 'string',
              description: 'Estado del pedido',
              example: 'pendiente',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación del pedido',
              example: '2023-10-01T12:34:56.789Z',
            },
          },
        },
        // Esquema de CartItem
        CartItem: {
          type: 'object',
          properties: {
            carritoId: {
              type: 'integer',
              description: 'ID del carrito',
              example: 1,
            },
            productoId: {
              type: 'integer',
              description: 'ID del producto',
              example: 1,
            },
            cantidad: {
              type: 'integer',
              description: 'Cantidad de productos en el carrito',
              example: 2,
            },
          },
        },
        // Esquema de Carrito
        Cart: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del carrito',
              example: 1,
            },
            usuarioId: {
              type: 'integer',
              description: 'ID del usuario al que pertenece el carrito',
              example: 1,
            },
            CartItems: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/CartItem',
              },
            },
          },
        },
      },
    },
  },
  apis: ['./routes/*.js'], // Ruta a tus archivos de rutas
};

const specs = swaggerJsdoc(options);

// Escribir la documentación en un archivo JSON
fs.writeFileSync(path.join(__dirname, 'swagger.json'), JSON.stringify(specs, null, 2));

console.log('Documentación de Swagger exportada a swagger.json');