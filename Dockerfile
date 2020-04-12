FROM node:lts as build

ARG DISCORD_TOKEN
ENV DISCORD_TOKEN=${DISCORD_TOKEN}

WORKDIR /app
COPY . ./
RUN npm install

FROM node:lts as production

ARG DISCORD_TOKEN
ENV DISCORD_TOKEN=${DISCORD_TOKEN}

WORKDIR /app
COPY --from=build /app /app

CMD ["npm", "start"]
