#proyecto tareas escolares 
## realizado con servicios (apis)
### usando como backend :	node.js, express, dotenv

**descripcion** : este proyecto, es un proyecto universitario para practicar la creacion de Apis usando
la tecnologia de Node.js y express

**fecha**: 09-feb-2026
**autor**: juan antonio 

**universidad politecnica de bacalar**


#BACKEND

librerias o herramientas usadas para la creacion de este proyecto 

| Herramienta/libreria | version | Descripcion |
|--- |--- |--- |
| Node.js | 20.11.x (LTS) | Entorno de ejecución para JavaScript en el servidor. |
| Expres.js| ^4.18.2 | Framework minimalista para la creación de la API y manejo de rutas. |
|npm|10.2.x|Gestor de paquetes para instalar y administrar las dependencias|
|Bycript| ^6.0.0               |una función de hashing de contraseñas basada en el algoritmo Blowfish, diseñada para ser lenta y resistente a ataques              |postman|10.21|Herramienta para pruebas de endpoints y documentación técnica|
|Dotenv|^17.3.1|Librería para la gestión de variables de entorno (seguridad de credenciales).|
|CORS|2.8.6|Middleware para permitir peticiones desde diferentes dominios (Frontend).|
|NODEMON|3.1.14|Herramienta de desarrollo para reiniciar el servidor automáticamente tras cambios.|
|PG|8.18.0|Cliente de PostgreSQL para realizar consultas y persistencia de datos.|
|jsonwebtoken|9.0.3|Implementación de tokens para la autenticación y seguridad de rutas.|


#estructura de rutas
|prefijo|recurso|descripcion|
|---|---|---|
|/api/ruth|autenticacion|login y registro de los usuarios|
|/api/periodos|periodos|gestion de los ciclos academicos|
|/api/materias|materias|CRUD de materias|
|/api/tareas|materias|seguimiento de tareas|
|/api/horarios|horarios|configuracion de los horarios|
