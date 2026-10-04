# Image de développement (server) — à builder depuis la racine (lockfile du workspace)
FROM node:24-slim

WORKDIR /app
ENV HUSKY=0

# procps fournit `ps`, utilisé par nest --watch pour arrêter l'ancien process au reload
RUN apt-get update && apt-get install -y --no-install-recommends procps && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci

COPY server server

EXPOSE 3000
CMD ["npm", "run", "start:dev", "-w", "server"]
