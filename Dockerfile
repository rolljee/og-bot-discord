# syntax=docker/dockerfile:1

# --- Étape 1 : dépendances ------------------------------------------------
# Isolée pour que le cache npm et les fichiers de lock ne finissent pas dans
# l'image finale.
FROM node:24-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev


# --- Étape 2 : runtime ----------------------------------------------------
FROM node:24-alpine

ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=node:node . .

# L'image node fournit un utilisateur `node` non privilégié (uid 1000) : rien
# dans ce bot ne justifie de tourner en root.
USER node

EXPOSE 8080

# `node` directement, et non `npm start` : npm en PID 1 ne relaie pas SIGTERM à
# son enfant, ce qui empêcherait l'arrêt propre géré dans index.js.
#
# DISCORD_TOKEN est fourni à l'exécution (secret_environment_variables côté
# Scaleway, `docker run -e` en local) et n'est jamais présent dans l'image.
CMD ["node", "index.js"]
