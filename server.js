require('dotenv').config();
const express = require('express');
const path = require('path');
const { sequelize, User, Product, Category, Cart, CartItem, Order } = require('./models');
// const { Sequelize } = require('sequelize');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const profileRoutes = require('./routes/profile');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/carts');
const orderRoutes = require('./routes/orders');
const categoryRoutes = require('./routes/categories');
const cors = require('cors'); 
const swaggerSetup = require('./config/swagger');
// const errorHandler = require('./middlewares/errorHandler');
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

// // Database configuration
// const sequelize = new Sequelize(process.env.DATABASE_URL, {
//   dialect: 'postgres',
//   dialectOptions: {
//     ssl: {
//       require: true,
//       rejectUnauthorized: false
//     }
//   },
//   logging: false
// });

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
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');
    
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}
