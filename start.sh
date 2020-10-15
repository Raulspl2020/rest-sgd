#!/bin/bash
echo "obteniendo cambios..."
#git pull
echo "Deteniendo contenedores..."
docker stop rest-sgd
echo "eliminando contenedores..."
docker rm rest-sgd
echo "eliminando imagenes..."
docker rmi rest-sgd
docker build -t rest-sgd .
echo "Creando nuevo contenedor..."
docker run --name rest-sgd --restart=always -d -p 3000:3000 rest-sgd

