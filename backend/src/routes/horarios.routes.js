const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/auth.middleware');
const controller = require('../controllers/horarios.controller');

router.post('/', verificarToken, controller.crearHorario);
router.get('/materia/:id_materia', verificarToken, controller.obtenerHorariosPorMateria);
router.get('/', verificarToken, controller.obtenerHorarioCompleto);
router.put('/:id', verificarToken, controller.actualizarHorario);
router.delete('/:id', verificarToken, controller.eliminarHorario);

module.exports = router;
