const app = require('./app');

// Si el .env no carga, usará el 3000 por defecto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor encendido en: http://localhost:${PORT}`);
  console.log('Presiona Ctrl+C para apagarlo');
});


