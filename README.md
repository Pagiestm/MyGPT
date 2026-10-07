<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="client/public/logo-white.svg" />
    <img src="client/public/logo.svg" alt="MyGPT" width="96" height="96" />
  </picture>

  <h1>MyGPT</h1>
  <p>Assistant IA conversationnel - le modèle tourne dans votre navigateur, sans installation, sans abonnement, sans service tiers</p>

![Vue](https://img.shields.io/badge/Vue-3.5-42b883?logo=vue.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-12-e0234e?logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169e1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ed?logo=docker&logoColor=white)

</div>

https://github.com/user-attachments/assets/9b079391-b17d-4230-9721-c40a35a1fa71

## Fonctionnalités

- **Modèle exécuté dans le navigateur** (WebGPU) : rien à installer, aucune donnée envoyée pour générer
- **Base de connaissances (RAG)** : documents indexés dans pgvector, vectorisés eux aussi dans le navigateur
- Réponses au fil de l'eau, Stop, régénération, questions modifiables, titre automatique
- Dossiers, épinglage, archives, corbeille (30 jours), recherche globale (Ctrl/⌘ + K), partage par lien, export Markdown
- Pièces jointes et documents **PDF** : le texte en est extrait pour que le modèle le lise
- Pièces jointes, dictée vocale, lecture à voix haute, Markdown et code colorés, thème clair/sombre

## Stack

| Couche    | Technologies                                                                         |
| --------- | ------------------------------------------------------------------------------------ |
| Frontend  | Vue 3, Vite, Nuxt UI 4, Tailwind CSS 4, Pinia Colada, Zod, Playwright                |
| Backend   | NestJS 12, TypeORM, PostgreSQL + pgvector, Passport, Swagger, Jest                   |
| IA        | [`@mlc-ai/web-llm`](https://github.com/mlc-ai/web-llm) - WebGPU, aucun service tiers |
| Outillage | npm workspaces, ESLint, Prettier, Husky, Commitlint, Docker                          |

## Démarrage

**Prérequis :** Node.js ≥ 24.9, Docker, un navigateur WebGPU (Chrome, Edge, Safari 26+, Firefox récent). Aucune clé d'API.

```bash
git clone https://github.com/Pagiestm/MyGPT.git
cd MyGPT && npm install && cp .env.example .env
docker compose up -d
```

| Service       | URL                       | Accès                              |
| ------------- | ------------------------- | ---------------------------------- |
| Application   | http://localhost:5173     |                                    |
| API / Swagger | http://localhost:3000/api |                                    |
| pgAdmin       | http://localhost:5050     | hôte `db`, `postgres` / `root`     |
| Mailpit       | http://localhost:8025     | tous les courriels envoyés en dev  |
| PostgreSQL    | `localhost:5432`          | `postgres` / `root`, base `my-gpt` |

Le code est monté dans les conteneurs : le rechargement à chaud fonctionne. Après un changement de dépendances, `docker compose up -d --build`. Sans Docker pour les apps : `docker compose up -d db pgadmin` puis `npm run dev`.

## Déploiement

Deux chemins, selon que vous hébergez vous-même ou non.

### Sur Render, avec Neon et Brevo

`render.yaml` décrit les deux services : l'API construite depuis `server/Dockerfile.prod`, et le client en site statique.

**Une seule origine.** Le navigateur ne parle qu'à l'hôte du client ; l'API n'est jointe qu'à travers une réécriture `/api/*`. Le cookie de session, en `sameSite: strict`, suit donc sans difficulté, et il n'y a aucun CORS à régler.

Peu importe lequel des deux hôtes porte le site : l'adresse `onrender.com` convient aussi bien qu'un domaine à vous. Le plan gratuit de Render n'inclut que deux domaines personnalisés par espace de travail, au-delà desquels il faut une carte.

Après le premier déploiement, Render attribue une adresse à l'API. Reportez-la dans `render.yaml` comme cible de la réécriture, et reprenez l'adresse du site statique dans `CLIENT_URL` et `GOOGLE_CALLBACK_URL`.

Renseignez ensuite les variables marquées `sync: false` dans le tableau de bord :

| Variable                                   | Où la trouver                                                   |
| ------------------------------------------ | --------------------------------------------------------------- |
| `DATABASE_URL`                             | chaîne de connexion Neon, avec `?sslmode=require`               |
| `SMTP_USER`, `SMTP_PASSWORD`               | identifiants SMTP Brevo                                         |
| `MAIL_FROM`                                | expéditeur **validé** chez Brevo, sinon les envois sont refusés |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | facultatif, console Google                                      |

Pour servir le site depuis un domaine à vous, un seul enregistrement DNS suffit : un `CNAME` du sous-domaine vers l'adresse `onrender.com` du site statique, puis le domaine à déclarer dans le service.

Le service web gratuit s'endort après quinze minutes et met environ une minute à se réveiller. Un ping régulier sur `/health` l'en empêche. Cette sonde ne touche pas la base, exprès : la tenir éveillée consommerait le quota de calcul de Neon. Pour vérifier aussi la base, utilisez `/health/ready`.

Render accorde 750 heures d'instance gratuites par mois et par espace de travail, soit à peine plus qu'un mois complet : un seul service maintenu éveillé tient, deux non. Le site statique, lui, ne s'endort jamais : la page reste instantanée.

### Sur votre propre serveur

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Images distinctes de celles du développement : build compilé, dépendances de production seules, utilisateur non root, `nginx` pour le client, base et API non exposées sur l'hôte.

Variables obligatoires, le démarrage échoue sans elles : `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `SESSION_SECRET` (32 caractères minimum), `CLIENT_URL`, `VITE_API_URL`, `APP_DOMAIN`, `API_DOMAIN`, `ACME_EMAIL`.

`VITE_API_URL` est figée au build : les variables Vite sont inlinées dans le bundle. Changer d'URL d'API impose de reconstruire l'image client.

Caddy termine le TLS et obtient les certificats Let's Encrypt tout seul. Lui seul est exposé, sur 80 et 443.

Un service de sauvegarde dépose un `pg_dump` dans le volume `db-backups`, toutes les 24 heures par défaut (`BACKUP_INTERVAL`), conservé 7 jours (`BACKUP_KEEP_DAYS`). Pour restaurer :

```bash
docker compose -f docker-compose.prod.yml exec db-backup \
  pg_restore -h db -U "$DB_USERNAME" -d "$DB_DATABASE" --clean /backups/mygpt-AAAAMMJJ-HHMMSS.dump
```

Les migrations s'appliquent au démarrage dans les deux cas.

## Comment fonctionnent les modèles

Le modèle s'exécute dans l'onglet de l'utilisateur. Le serveur ne détient aucun poids et n'appelle aucune API d'IA : il assemble le prompt et écrit en base.

| Appel                                    | Qui agit   | Ce qui se passe                           |
| ---------------------------------------- | ---------- | ----------------------------------------- |
| `POST /chat/messages`                    | serveur    | enregistre la question, renvoie le prompt |
| -                                        | navigateur | génère la réponse en WebGPU               |
| `POST /chat/replies` puis `/chat/titles` | serveur    | enregistre la réponse, puis le titre      |

`@mlc-ai/web-llm` est une **bibliothèque npm, pas une API** : ni clé, ni quota, aucun appel réseau par message. À ne pas confondre avec Ollama, que ce projet n'utilise pas. Elle pèse ~6 Mo et n'est chargée par `import()` dynamique que lorsqu'un modèle sert ; un test e2e verrouille ce point.

Le catalogue vit en base (`ai_models`), administrable depuis `/admin` sans redéploiement. Chaque modèle porte une description, ses points forts et ses limites, sa taille et ses prérequis GPU - ces derniers repris automatiquement de WebLLM.

Les poids sont téléchargés au premier message et conservés dans le Cache Storage du navigateur. Rien ne se met à jour tout seul : chaque modèle porte une **révision**, et l'incrémenter depuis `/admin` fait retélécharger les poids chez tous les utilisateurs sans action de leur part.

Sans WebGPU, l'application le signale au lieu d'échouer. Il n'y a pas de repli vers un service en ligne.

## Sécurité

| Protection        | Mise en oeuvre                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------- |
| Sessions          | stockées en base (`user_sessions`), elles survivent aux redéploiements                    |
| Secret de session | obligatoire en production, 32 caractères minimum, refus de démarrer sinon                 |
| Cookie de session | `httpOnly`, `secure` et `sameSite: strict` en production                                  |
| CSRF              | double soumission : cookie `mygpt.csrf` + en-tête `X-CSRF-Token` sur toute écriture       |
| Connexion Google  | optionnelle : sans `GOOGLE_CLIENT_ID` ni `GOOGLE_CLIENT_SECRET`, le bouton n'apparaît pas |
| Origine           | les requêtes d'écriture venant d'une origine non déclarée sont refusées                   |
| En-têtes          | `helmet` (HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy`)                          |
| Débit             | 30 req/s et 300 req/min par IP ; 10 tentatives / 15 min sur connexion et inscription      |

Le client récupère le jeton sur `GET /csrf`, le met en cache et le renvoie via un intercepteur axios ; sur un 403 il le renouvelle et rejoue la requête une fois.

### Mot de passe oublié

Le lien n'apparaît que si l'instance sait envoyer des courriels (`SMTP_HOST` et `MAIL_FROM`). Le jeton est valable une heure, ne sert qu'une fois, et n'est jamais stocké en clair : seule son empreinte l'est. La réponse est la même que l'email existe ou non, pour ne pas révéler qui a un compte.

Les courriels sont écrits en MJML (`server/src/common/mail/`), compilés en HTML à l'envoi. En développement, Mailpit les capture tous.

### Connexion avec Google

Facultative. Renseignez `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` et `GOOGLE_CALLBACK_URL` ([console Google](https://console.cloud.google.com/apis/credentials)) : le bouton apparaît alors sur la connexion et l'inscription.

Un compte Google dont l'email est déjà connu est **lié** au compte existant, qui garde son mot de passe. Un email inconnu crée un compte sans mot de passe, dont le pseudo reprend le nom Google et reste modifiable dans les réglages.

La génération reste dans le navigateur : Google ne voit que les connexions, jamais les conversations.

## Rôles et migrations

Deux rôles sur `users.role`. Un administrateur gère le catalogue de modèles et les rôles ; tout le reste se déduit de la propriété des données. Le premier se désigne en base, les suivants depuis `/admin`, où un garde-fou empêche de retirer le dernier.

```bash
docker compose exec db psql -U postgres -d my-gpt \
  -c "UPDATE users SET role = 'admin' WHERE email = 'vous@exemple.com';"
```

En développement `synchronize` applique le schéma ; en production les migrations font foi.

```bash
npm run migration:generate -w server -- src/database/migrations/NomDeLaMigration
npm run migration:run -w server
```

## Structure

Le serveur suit une clean architecture, le client un découpage par feature. Dans les deux cas, une feature ne touche jamais l'intérieur d'une autre : elle passe par sa surface publique.

```
MyGPT/
├── client/src/
│   ├── app/                 # App.vue, layouts, plugins, routeur racine
│   ├── shared/              # ui, composables, lib, types partagés
│   └── features/<nom>/      # components, composables, api, pages, routes.ts, index.ts
├── server/src/<module>/
│   ├── domain/              # modèle métier sans framework, ports de persistance
│   ├── application/         # cas d'usage, un execute() par intention
│   └── infrastructure/      # entités TypeORM, adaptateurs, contrôleurs, DTO
├── docker-compose.yml       # développement
└── docker-compose.prod.yml  # production
```

Imports explicites partout, y compris pour Nuxt UI : aucun auto-import.

## Scripts et tests

| Commande                  | Description                                |
| ------------------------- | ------------------------------------------ |
| `npm run dev`             | Lance le serveur et le client              |
| `npm run build`           | Build des deux applications                |
| `npm run lint` / `format` | ESLint / Prettier sur tout le monorepo     |
| `npm run typecheck`       | Vérification TypeScript (client + serveur) |
| `npm test` / `test:cov`   | Tests unitaires Jest (serveur)             |
| `npm run test:e2e`        | Tests end-to-end Playwright (client)       |

Approche **TDD**. Jest sur le serveur ; Playwright sur Chromium, Firefox et WebKit, contre le build de production. Un faux back-end en mémoire (`client/tests/support/fakeApi.ts`) répond à toute l'API : ni base de données, ni GPU. La génération est jouée par un double activé par `VITE_FAKE_LLM=1`, éliminé du build de production.

GitHub Actions sur `main` et `develop` : format, lint, typecheck, build, tests unitaires avec couverture, puis E2E. Husky + lint-staged avant chaque commit, [Conventional Commits](https://www.conventionalcommits.org/) via Commitlint.

## Licence

[CC BY-NC-SA 4.0](LICENSE) : usage non commercial, attribution obligatoire, partage dans les mêmes conditions.

---

<p align="center">Développé par Théotime · © 2025</p>
