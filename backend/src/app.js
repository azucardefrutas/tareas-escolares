require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// 1. Configuración de CORS y Middlewares
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://192.168.1.152:3001'
  ],
  credentials: true
}));

// 2. Middleware para parsear el cuerpo de las peticiones (JSON)
app.use(express.json());

// 3. Rutas principales de la API
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/periodos', require('./routes/periodos.routes'));
app.use('/api/materias', require('./routes/materias.routes'));
app.use('/api/horarios', require('./routes/horarios.routes'));
app.use('/api/tareas', require('./routes/tareas.routes'));

// EXPORTAR AL FINAL
module.exports = app;