#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"
set -o allexport
source .env
set +o allexport

ssh "$USER@$IP_ADDR" 'cd ~/Code/og-bot-discord
                      git pull origin master
                      docker build -t og-bot:latest .
                      docker rm og-bot --force || true
                      docker run --name og-bot -d --restart unless-stopped -e DISCORD_TOKEN="'"$DISCORD_TOKEN"'" og-bot:latest'
