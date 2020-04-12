set -e
source .env

ssh -i ~/.ssh/id_rsa.pub $USER@$IP_ADDR
cd ~/Code/og-bot-discord
git pull origin master
docker stop og-bot && docker rm og-bot
docker build -t og-bot:latest && docker run --rm --name og-bot -d og-bot

set +e
