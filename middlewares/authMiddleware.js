const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) return res.status(401).json({ error: 'Token no proporcionado.' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token no proporcionado.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado.' });

    req.user = {
      id: user.id,
      rol: user.rol,
    };
    next();
  } catch (error) {
    console.error('Error en authMiddleware:', error);
    return res.status(401).json({ error: 'Token inválido.' });
  }
};

module.exports = authMiddleware;