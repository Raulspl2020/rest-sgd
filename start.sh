#!/bin/bash
echo "obteniendo cambios..."
git pull
echo "Deteniendo contenedores..."
docker stop api-sgd
echo "eliminando contenedores..."
docker rm api-sgd
echo "eliminando imagenes..."
docker rmi api-sgd
docker build -t api-sgd .
echo "Creando nuevo contenedor..."
docker run --name api-sgd --restart=always -d -p 3000:1995 api-sgd

