-- =============

-- USUARIO DE PRUEBA
-- ===============
 
-- =============
-- PERIODO DE PRUEBA
-- ===============

INSERT INTO periodos (nombre, fecha_inicio , fecha_fin, usuario)
VALUES ('2026-1' , '2026-01-05', '2026-04-30',2);

-- =============
-- MATERIA DE PRUEBA
-- ===============

INSERT INTO materias (nombre,profesor, id_periodo)
VALUES ('Base de datos' , 'prof.Daniel villegas' , 2);

-- =============
-- HORARIO DE PRUEBA
-- ===============

INSERT INTO horarios (dia_semana, hora_inicio , hora_fin, id_materia)
VALUES ('Lun' , '7:00' , '9:30' , 1)

INSERT INTO horarios (dia_semana, hora_inicio , hora_fin, id_materia)
VALUES ('Mie' , '10:30' , '13:00' , 1)


-- =============
-- TAREA DE PRUEBA
-- ===============

INSERT INTO tareas (titulo,descripcion,fecha_entrega, completada,id_materia)
VALUES ('modelo ER','diseñar el modelo ER del proyecto', '2026-03-02', false, 1 );

-- =============
-- EJECUTAR EL ARCHIVO QSL
-- psql -U usuario -d nombre_base_datos
-- psql -U postgres -d dbtareas -f 
-- ===============



