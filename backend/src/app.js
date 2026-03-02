require('dotenv').config(); // 👈 SIEMPRE PRIMERO

console.log("DB_PASSWORD =", process.env.DB_PASSWORD);

const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/periodos', require('./routes/periodos.routes'));
app.use('/api/materias', require('./routes/materias.routes'));
app.use('/api/horarios', require('./routes/horarios.routes'));
app.use('/api/tareas', require('./routes/tareas.routes'));

module.exports = app;
