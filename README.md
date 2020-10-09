# API-SIGEDIN

### instalacion

Descargar el proyecto y ejecutar el archivo server.js que se encuentra dentro de la carpeta server: `server/server.js`


## Documentación
Podemos usar las rutas creadas con sus respectivos metodos

### 1 - Login
Apuntamos a la ruta `localhost/login` con el tipo de peticion `GET`, el parametro `ex` nos ayuda a generar un toquen con tiempo de expiracion de 1 año
| Parametros | Tipo de dato |Obligatorio |
| ------ | ------ | ------ |
| user | String | Si
| pass | String | Si
| ex | int | No

