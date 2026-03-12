const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/auth.middleware');
const controller = require('../controllers/tareas.controller');



/**
 endpoints : 
 */

//http://localhost:3000/api/tareas/   metodo post  nueva tarea
//http://localhost:3000/api/tareas/   metodo get  consultar todas las  tareas
//http://localhost:3000/api/tareas/id metodo get  consultar una tarea
//http://localhost:3000/api/tareas/id metodo put  actualizar tarea 
//http://localhost:3000/api/tareas/id completar una tarea metodo patch cabiar el estado 
//http://localhost:3000/api/tareas/id borrar una tarea metodo delete 

// http://localhost:3000/api/tareas/estado/pendiente metodo get 
// http://localhost:3000/api/tareas/estado/completadas metodo get 
// http://localhost:3000/api/tareas/estado/vencidas  metodo get 






// crear una nueva tarea 
router.post('/', verificarToken, controller.crearTarea);
// consultar las tareas 
router.get('/', verificarToken, controller.obtenerTodasLasTareas);
// consultar la tarea por id 
router.get('/:id', verificarToken, controller.obtenerTareaPorId);
// actualizar la tarea por id
router.put('/:id', verificarToken, controller.actualizarTarea);
// marcar como completada una tarea por id 
router.patch('/:id/completar', verificarToken, controller.marcarComoCompletada);
// eliminar la tarea por id 
router.delete('/:id', verificarToken, controller.eliminarTarea);

//                                      enpoints adicionales

// tareas pendientes 
router.get('/estado/pendientes', verificarToken, controller.tareasPendientes);

// tareas vencidas
router.get('/estado/vencidas', verificarToken, controller.tareasVencidas);

// tareas completadas
router.get('/estado/completadas', verificarToken, controller.tareasCompletadas);


module.exports = router;
