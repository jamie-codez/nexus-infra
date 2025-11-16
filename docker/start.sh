#!/bin/bash
# This script is used to initialize the environment
docker compose -f ./docker-compose.yaml --env-file ./.env up -d --remove-orphans

# Run this the first time you run the start script
sudo chown -R 5050:5050 "${PWD}"/databases/pgadmin
sudo chown -R 1000:1000 "${PWD}"/media/sftpgo