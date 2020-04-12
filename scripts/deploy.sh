#!/bin/bash

cd scripts
set -o allexport
source .env
set +o allexport

ssh $USER@$IP_ADDR 'cd ~/Code/og-bot-discord && git pull origin master && docker build -t og-bot:latest . && docker run --rm --name og-bot -d og-bot --build-args DISCORD_TOKEN=$DISCORD_TOKEN'
