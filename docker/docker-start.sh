#!/bin/sh

# Builds the image
cd musicdle-game/
docker build -f docker/Dockerfile -t musicdle .
docker rm -f musicdle
# Runs the image in the background under the name musicdle
docker run -d --name musicdle -p 80:80 -p 443:443 musicdle
