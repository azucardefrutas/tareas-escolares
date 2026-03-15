require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// 1. Configuración de CORS (Permite a tu frontend de Vite conectarse)
// 1. Configuración de CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// 2. Middlewares para parsear el cuerpo de las peticiones
app.use(express.json());

// 3. Rutas (Asegúrate de que los archivos existan en la carpeta routes)
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/periodos', require('./routes/periodos.routes'));
app.use('/api/materias', require('./routes/materias.routes'));
app.use('/api/horarios', require('./routes/horarios.routes'));
app.use('/api/tareas', require('./routes/tareas.routes'));

// EXPORTAR AL FINAL
module.exports = app;