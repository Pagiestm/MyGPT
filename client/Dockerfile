# Image de développement (client) — à builder depuis la racine (lockfile du workspace)
FROM node:24-slim

WORKDIR /app
ENV HUSKY=0

COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci

COPY client client

EXPOSE 5173
CMD ["npm", "run", "dev", "-w", "client", "--", "--host", "0.0.0.0"]
