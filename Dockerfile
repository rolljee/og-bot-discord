FROM node:24-alpine

WORKDIR /app

# Install production dependencies from the lockfile for reproducible builds
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . ./

# DISCORD_TOKEN is provided at runtime (docker run -e DISCORD_TOKEN=...),
# never baked into the image.
CMD ["npm", "start"]
