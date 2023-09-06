#!/bin/bash
echo "obteniendo cambios..."
#git pull
echo "Deteniendo contenedores..."
docker stop rest-sgd-stable
echo "eliminando contenedores..."
docker rm rest-sgd-stable
echo "eliminando imagenes..."
docker rmi rest-sgd-stable
docker build -t rest-sgd-stable .
echo "Creando nuevo contenedor..."
docker run --name rest-sgd-stable --restart=always -d -p 3000:3000 rest-sgd-stable

