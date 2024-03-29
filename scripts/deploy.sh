#!/bin/bash

cd scripts
set -o allexport
source .env
set +o allexport

ssh $USER@$IP_ADDR 'cd ~/Code/og-bot-discord
										git pull origin master
										docker build --build-arg DISCORD_TOKEN="'$DISCORD_TOKEN'" -t og-bot:latest .
										docker rm og-bot --force
										docker run --name og-bot -d og-bot'
