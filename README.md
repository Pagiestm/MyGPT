<div align="center">
  <img src="client/public/logo.svg" alt="MyGPT" width="96" height="96" />

  <h1>MyGPT</h1>
  <p>Assistant IA conversationnel propulsé par Google Gemini</p>

![Vue](https://img.shields.io/badge/Vue-3.5-42b883?logo=vue.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-12-e0234e?logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169e1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ed?logo=docker&logoColor=white)

</div>

https://github.com/user-attachments/assets/9b079391-b17d-4230-9721-c40a35a1fa71

## Fonctionnalités

- Conversations avec Gemini : réponses diffusées en direct (SSE), bouton Stop, régénération, questions modifiables
- Titre de conversation généré automatiquement après le premier échange
- Pièces jointes (images, PDF, fichiers texte et code, 10 Mo max) lues par l'IA
- Choix du modèle (Flash, Pro, Flash Lite) à chaque message
- Dictée vocale et lecture à voix haute des réponses
- Conversations épinglées, archivées, rangées dans des dossiers avec consignes communes
- Recherche globale (Ctrl/⌘ + K) dans les conversations et les messages
- Consignes personnalisées et modèle par défaut dans les réglages
- Rendu Markdown complet et blocs de code colorés (Shiki), copiables en un clic
- Partage par lien en lecture seule, accessible sans compte, avec expiration optionnelle
- Bibliothèque des conversations partagées enregistrées
- Thème clair, sombre ou système, interface responsive

## Stack

| Couche    | Technologies                                                                 |
| --------- | ---------------------------------------------------------------------------- |
| Frontend  | Vue 3, Vite, Nuxt UI 4, Tailwind CSS 4, Pinia, Pinia Colada, Zod, Playwright |
| Backend   | NestJS 12, TypeORM, PostgreSQL, Passport, Swagger, Jest                      |
| Outillage | npm workspaces, ESLint, Prettier, Husky, lint-staged, Commitlint, Docker     |

## Démarrage rapide

**Prérequis :** Node.js ≥ 24.9, Docker, une [clé API Gemini](https://aistudio.google.com/apikey).

```bash
git clone https://github.com/Pagiestm/MyGPT.git
cd MyGPT
npm install
cp .env.example .env   # renseigner GEMINI_API_KEY
```

Un **seul `.env` à la racine** est lu par Docker Compose, le serveur et le client (seules les variables `VITE_*` sont exposées au navigateur).

### Option 1 — Tout dans Docker

```bash
docker compose up -d
```

| Service       | URL                       | Accès                              |
| ------------- | ------------------------- | ---------------------------------- |
| Application   | http://localhost:5173     |                                    |
| API / Swagger | http://localhost:3000/api |                                    |
| pgAdmin       | http://localhost:5050     | hôte `db`, `postgres` / `root`     |
| PostgreSQL    | `localhost:5432`          | `postgres` / `root`, base `my-gpt` |

Le code source est monté dans les conteneurs : toute modification locale recharge automatiquement le front (HMR Vite) et le back (`nest --watch`).

```bash
docker compose logs -f server   # suivre les logs
docker compose down             # arrêter
docker compose down -v          # arrêter et supprimer les données
docker compose up -d --build    # reconstruire après un changement de dépendances
```

### Option 2 — Base en Docker, apps en local

```bash
docker compose up -d db pgadmin   # PostgreSQL + pgAdmin
npm run dev                       # serveur + client en parallèle
```

## Scripts

Tous les scripts se lancent depuis la racine.

| Commande                          | Description                                |
| --------------------------------- | ------------------------------------------ |
| `npm run dev`                     | Lance le serveur et le client              |
| `npm run build`                   | Build des deux applications                |
| `npm run lint` / `lint:fix`       | ESLint sur tout le monorepo                |
| `npm run format` / `format:check` | Prettier sur tout le monorepo              |
| `npm run typecheck`               | Vérification TypeScript (client + serveur) |
| `npm test` / `test:cov`           | Tests unitaires Jest (serveur)             |
| `npm run test:e2e`                | Tests end-to-end Playwright (client)       |

Pour cibler un workspace : `npm run <script> -w server` ou `-w client`.

## Tests

Le projet suit une approche **TDD** (Red → Green → Refactor).

- **Unitaires** — Jest sur les services, contrôleurs, guards et stratégies du serveur.
- **End-to-end** — Playwright sur Chromium, Firefox et WebKit, contre le build de production (`vite preview`). Un faux back-end en mémoire (`client/tests/support/fakeApi.ts`) répond à toute l'API : les tests n'ont besoin ni de base de données ni de Gemini.

https://github.com/user-attachments/assets/faf5ac6b-41f5-45c2-8487-6794d810c52e

https://github.com/user-attachments/assets/3ad72488-0684-4037-8e9a-581f421c15e6

## Qualité de code

- **ESLint + Prettier** : une configuration unique à la racine (`eslint.config.mjs`, `.prettierrc.json`) pour le client et le serveur.
- **Husky + lint-staged** : avant chaque commit, ESLint et Prettier s'exécutent sur les seuls fichiers indexés.
- **Commitlint** : messages au format [Conventional Commits](https://www.conventionalcommits.org/) — `type(scope): description`, avec les types `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- **GitHub Actions** : sur `main` et `develop`, format, lint et typecheck, puis tests unitaires avec couverture, puis tests E2E.

## Architecture du client

Le client suit une **clean architecture** en quatre couches. Chaque couche ne dépend que de celles du dessous.

```
client/src/
├── domain/          # entités, schémas Zod, règles métier pures (sans Vue ni HTTP)
├── infrastructure/  # client HTTP et un repository par ressource de l'API
├── application/     # store de session, composables de cas d'usage (requêtes, mutations, cache)
└── presentation/    # router, layouts, vues (une par route), composants
```

- **Routes déclarées explicitement** dans `presentation/router/routes.ts`, avec garde d'authentification et redirection des anciennes URL.
- **Imports explicites** partout, y compris pour les composants Nuxt UI : aucun auto-import.
- **Pinia Colada** gère le cache des requêtes, les états de chargement et les mises à jour optimistes (la question s'affiche avant la réponse de l'IA, puis la réponse s'écrit au fil du flux).

## Structure

```
MyGPT/
├── client/                 # Vue 3 + Vite
│   ├── src/                # domain, infrastructure, application, presentation
│   ├── tests/              # tests Playwright et faux back-end
│   └── Dockerfile
├── server/                 # NestJS
│   ├── src/                # auth, user, conversation, message, infrastructure (Gemini)
│   └── Dockerfile
├── docker-compose.yml      # PostgreSQL, pgAdmin, server, client
├── .env.example            # variables d'environnement (unique)
├── eslint.config.mjs
└── package.json            # workspaces + outillage partagé
```

## Licence

[CC BY-NC-SA 4.0](LICENSE) : usage non commercial, attribution obligatoire, partage dans les mêmes conditions.

---

<p align="center">Développé par Théotime · © 2025</p>
