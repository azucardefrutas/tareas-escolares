const express = require('express');
const router = express.Router();
// Importamos el controlador que creamos arriba
const authController = require('../controllers/auth.controller');

// Definimos las rutas
// Nota: Como en app.js ya usas app.use('/api/auth', ...), 
// aquí solo necesitas poner '/register'
router.post('/register', authController.register);
router.post('/login', authController.login);

// Exportamos el router al final
module.exports = router;