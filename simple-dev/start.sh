#!/bin/bash
# This script is used to initialize the environment
docker compose -f ./docker-compose.yaml build
docker compose -f ./docker-compose.yaml --env-file ../docker/.env up -d --remove-orphans

# Run this the first time you run the start script
sudo chown -R 5050:5050 ${PWD}/../docker/pgadmin
sudo chown -R 1000:1000 ${PWD}/../docker/sftpgo