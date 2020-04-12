FROM node:lts as build

WORKDIR /app
COPY . ./
RUN npm install

FROM node:lts as production

WORKDIR /app
COPY --from=build /app /app

CMD ["npm", "start"]
