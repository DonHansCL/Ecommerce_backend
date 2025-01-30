require('dotenv').config();
const express = require('express');
const path = require('path');
const { sequelize, User, Product, Category, Cart, CartItem, Order } = require('./models');
const { Sequelize } = require('sequelize');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const profileRoutes = require('./routes/profile');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/carts');
const orderRoutes = require('./routes/orders');
const categoryRoutes = require('./routes/categories');
const cors = require('cors'); 
const swaggerSetup = require('./config/swagger');
const errorHandler = require('./middlewares/errorHandler');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Configurar CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://ecommerce-frontend-4zal.onrender.com'
    : 'http://localhost:3000',
  credentials: true
}));

// Database configuration
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

// Servir archivos estáticos de la carpeta uploads
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOADS_DIR)));
app.use('/uploads/categories', express.static(path.join(__dirname, 'uploads/categories')));
app.use('/images', express.static(path.join(__dirname, 'images')));


  // Usar Rutas
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/carts', cartRoutes);
  app.use('/api/pedidos', orderRoutes);
  app.use('/api/categories', categoryRoutes);
  
  // Ruta Principal
  app.get('/', (req, res) => {
    res.send('Backend server está corriendo');
  });

  // Configurar Swagger
swaggerSetup(app);

// Export app before starting server
module.exports = app;

// Conectar a la base de datos y sincronizar modelos
if (require.main === module) {
  sequelize.authenticate()
    .then(() => {
      console.log('Conectado a la base de datos');
      return sequelize.sync({ alter: true });
    })
    .then(() => {
      console.log('Modelos sincronizados');
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Servidor corriendo en el puerto ${PORT}`);
        console.log(`Documentación disponible en http://localhost:${PORT}/api-docs`);
      });
    })
    .catch(err => {
      console.error('Error de conexión:', err);
      process.exit(1);
    });
}