#!/bin/bash

echo "Starting..."
mkdir -p data/db

if [ "$1" = "-v" ]; then
  echo "Docker prune..."
  docker system prune --all --volumes
  docker volume rm $(docker volume ls -q)
fi

docker-compose down
docker-compose up --build
