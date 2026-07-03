# API-SIGEDIN

### instalacion

Configurar `.env`

Tener instalado `node-14.17`
    como instalar node con nvm `nvm install v14.17`
    como usar node `nvm use v14.17`
    verificar la versión de node `node -v`

Instalar `npm install -g nodemon`

Instalar todos los requerimientos `npm install`

Como correr el proyecto 
Opción 1: `npm run watch` // esta opcion es para corre el proyecto y ver la modificaciones en tiempo real
Opcion 2: `npm start`     // carga el proyecto y lo corre pero no se puede observar las modificaciones en tiempo real

Es necesario contar con una base de datos configurada en el .env


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

