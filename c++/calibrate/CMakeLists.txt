
## Para compilar dentro de la instacia Docker:
## 1. Levantar la instancia:
## sudo docker run --platform linux/x86_64 -v /home/ejfdelgado/desarrollo/c++:/tmp/sources -v /home/ejfdelgado/desarrollo/ejflab/c++:/tmp/sources/workspace --name compile -p 41061:22 ejfdelgado/compile:v0.2
## 2. Si sale error docker: Error response from daemon: Conflict.
## sudo docker rm ad4de59036c750e11c2bc461e0faffa32ec27cf87bb56ba70f63a96bf9d084aa
## 3. La instancia se queda corriendo, se debe conectar
## ssh root@localhost -p 41061
## 4. use password root
## 5. Copiar el bin a ejflab/bin-docker
## 6. Detener la instancia... después de compilar
## sudo docker ps
## sudo docker stop 37011c753187

## Container:
## export OpenCV_DIR=/tmp/sources/build-docker/opencv-4.x
## export nlohmann_json_DIR=/tmp/sources/build-docker/json-3.11.2
## cd /tmp/sources/workspace/calibrate
## sudo rm -R build && mkdir build && cd build
## cmake ../ && make -j 8
## node ../../utils/shared-libs.js ./solvePnP ../../bin-docker
##
## Local
## export OpenCV_DIR=/home/ejfdelgado/desarrollo/vaale/build
## export nlohmann_json_DIR=/home/ejfdelgado/desarrollo/c++/build-local/json-3.11.2
## cd /home/ejfdelgado/desarrollo/ejflab/c++/calibrate
## sudo rm -R build && mkdir build && cd build
## cmake ../ && make -j 8 && node ../../utils/shared-libs.js ./solvePnP ../../../bin-local

## npm install -g npm@9.7.2

## Para mandar a Cloud Run de Google
## 1. npm run build_local
## 2. sudo docker build --platform linux/x86_64 -t gcr.io/ejfexperiments/mainapp:v1.8 .
## 3. docker push gcr.io/ejfexperiments/mainapp:v1.8
## Luego usar terraform pero antes modificar la versión en terra/run.tf
## cd terra
## 4. terraform apply
## https://mainapp-7b6hvjg6ia-uc.a.run.app/projection
## Para borrar las versiones viejas:
## 5. gcloud container images delete gcr.io/ejfexperiments/mainapp:v1.7

cmake_minimum_required(VERSION 2.8)
project( solvePnP )
find_package( OpenCV REQUIRED )
find_package(nlohmann_json 3.11.2 REQUIRED)
include_directories( ${OpenCV_INCLUDE_DIRS} )
add_executable( solvePnP solvePnP.cpp )
target_link_libraries( solvePnP ${OpenCV_LIBS} nlohmann_json::nlohmann_json)