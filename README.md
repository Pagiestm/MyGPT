<div align="center">
  <div class="logo-container">
    <img src="client/public/logo.svg" alt="MyGPT Logo" width="120" height="120" class="animated-logo"/>
    <div class="glow"></div>
  </div>
  
  <h1 class="title">MyGPT <span class="version">v1.0</span></h1>
  <h3 class="subtitle">Assistant IA Conversationnel</h3>
  
  <div class="badges">
    <img src="https://img.shields.io/badge/Vue.js-3.3+-42b883.svg?style=for-the-badge&logo=vue.js&logoColor=white" alt="Vue.js"/>
    <img src="https://img.shields.io/badge/NestJS-11+-e0234e.svg?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS"/>
    <img src="https://img.shields.io/badge/TypeScript-5.0+-3178c6.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
    <img src="https://img.shields.io/badge/Tailwind-4.0-38bdf8.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind"/>
  </div>

  <p class="description"><em>Une plateforme de conversation IA moderne qui révolutionne vos interactions avec l'intelligence artificielle</em></p>
</div>

<style>
  /* Styles généraux */
  .logo-container {
    position: relative;
    margin: 20px auto;
    width: 120px;
    height: 120px;
  }
  
  .animated-logo {
    animation: float 4s ease-in-out infinite;
    filter: drop-shadow(0 5px 15px rgba(99, 102, 241, 0.4));
    z-index: 2;
    position: relative;
  }
  
  .glow {
    position: absolute;
    width: 100%;
    height: 20px;
    background: radial-gradient(ellipse at center, rgba(99, 102, 241, 0.3) 0%, rgba(99, 102, 241, 0) 70%);
    bottom: -10px;
    left: 0;
    z-index: 1;
    border-radius: 50%;
    animation: glow 4s ease-in-out infinite;
    filter: blur(8px);
    transform-origin: center;
  }
  
  /* Animation du logo */
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-15px); }
    100% { transform: translateY(0px); }
  }
  
  @keyframes glow {
    0% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.1); }
    100% { opacity: 0.5; transform: scale(1); }
  }
  
  /* Styles pour les titres */
  .title {
    font-size: 3.5rem;
    font-weight: 800;
    margin: 10px 0 0;
    background: linear-gradient(45deg, #6366F1, #8B5CF6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 2px 10px rgba(99, 102, 241, 0.2);
  }
  
  .version {
    font-size: 1.2rem;
    vertical-align: super;
    background: linear-gradient(45deg, #6366F1, #8B5CF6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 500;
    margin-left: 5px;
  }
  
  .subtitle {
    font-size: 1.5rem;
    font-weight: 400;
    margin-top: 0;
    color: #6B7280;
  }
  
  /* Styles pour la description */
  .description {
    max-width: 600px;
    font-size: 1.1rem;
    line-height: 1.6;
    margin: 20px auto;
  }
  
  /* Styles pour les badges */
  .badges {
    margin: 20px 0;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
  }
</style>

## 📋 Présentation

MyGPT est une application web permettant aux utilisateurs de converser avec un modèle d'intelligence artificielle via une interface intuitive et élégante. Développée avec des technologies modernes, elle offre une expérience utilisateur fluide et des fonctionnalités avancées pour tirer le meilleur parti des modèles d'IA conversationnels.

### 🌟 Fonctionnalités clés

- **Conversations IA interactives** : Dialoguez en temps réel avec le modèle Gemini de Google qui répond à vos questions, génère du contenu créatif et vous aide dans vos tâches quotidiennes
- **Authentification complète** : Système d'inscription avec validation des données, connexion sécurisée et gestion intuitive de votre profil
- **Gestion de profil personnalisée** : Modifiez facilement votre pseudo et gérez vos paramètres de compte
- **Organisation par conversations** : Créez différentes conversations thématiques pour mieux organiser vos échanges avec l'IA
- **Historique persistent** : Retrouvez l'intégralité de vos conversations précédentes, même après déconnexion
- **Recherche avancée** :
  - Recherchez dans toutes vos conversations par mots-clés
  - Filtrez précisément les messages dans une conversation spécifique
- **Partage de conversations** : Générez des liens uniques pour partager vos conversations publiquement
- **Formatage Markdown optimisé** : Profitez du rendu enrichi avec support pour:
  - Texte en gras, italique et autres formats
  - Blocs de code avec coloration syntaxique pour plus de 170 langages
  - Listes à puces et numérotées
- **Interface adaptative** : Design responsive qui s'adapte parfaitement à tous vos appareils
- **Édition interactive** : Modifiez vos questions précédentes pour obtenir de nouvelles réponses de l'IA
- **Sécurité renforcée** : Protection contre les sessions expirées et gestion automatique des déconnexions

## 🚀 Technologies utilisées

### Frontend

- **Vue.js 3** avec Composition API et TypeScript pour une interface réactive et fortement typée
- **Tailwind CSS** pour un design élégant et responsive
- **Pinia** pour une gestion d'état efficace et prévisible
- **Vue Router** pour une navigation fluide entre les différentes pages
- **Vue Toastification** pour des notifications claires et informatives
- **Playwright** pour des tests End-to-End automatisés et fiables

### Backend

- **NestJS** avec une architecture modulaire et des services bien organisés
- **Module infrastructure** pour une intégration propre avec l'API Gemini
- **TypeORM** pour une gestion de la persistance avec des entités fortement typées
- **PostgreSQL** comme base de données relationnelle robuste
- **Jest** pour des tests unitaires complets
- **Gemini API** pour des interactions IA de haute qualité
- **Passport.js** pour une authentification sécurisée
- **Swagger** pour une documentation API interactive et complète
- **bcrypt** pour un hachage sécurisé des mots de passe

## 🖥️ Aperçu de l'application

MyGPT offre une expérience utilisateur moderne et intuitive:

- **Page d'accueil** attrayante présentant les fonctionnalités principales
- **Interface de chat** élégante avec support complet du formatage Markdown
- **Panneau de gestion des conversations** pour passer facilement d'une conversation à l'autre
- **Profil utilisateur** permettant de personnaliser vos informations
- **Système de recherche** intuitif avec mise en évidence des résultats

## 🛠️ Installation et démarrage

### Prérequis

- Node.js (v18 ou supérieur)
- PostgreSQL (v14 ou supérieur)
- Une clé API Gemini (Google AI)

### Configuration de l'environnement

1. **Cloner le dépôt**

```bash
git clone https://github.com/Pagiestm/MyGPT.git
cd MyGPT
```

2. **Installation des dépendances**

```
# Installation des dépendances frontend
cd client
npm install

# Installation des dépendances backend
cd ../server
npm install
```

3. **Configuration des variables d'environnement**

Pour le backend (créez un fichier .env dans le dossier server) :

```
# Base de données PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=votre_mot_de_passe
DB_DATABASE=my-gpt

# Configuration de l'API Gemini
GEMINI_API_KEY=votre_clé_api_gemini
GEMINI_MODEL=gemini-2.0-flash

# Configuration session et sécurité
SESSION_SECRET=your-very-secure-secret-key-for-session
JWT_SECRET=your-very-secure-secret-key-for-email-verification

# Server
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

Pour le frontend (créez un fichier .env dans le dossier client) :

```
VITE_API_URL=http://localhost:3000
```

4. **Création et initialisation de la base de données**

```
# Créer une base de données PostgreSQL nommée 'my-gpt'
# Puis démarrer le serveur pour créer les tables
cd server
npm run start:dev
```

### Démarrage de l'application

1. **Mode développement**

```
# Terminal 1 - Backend
cd server
npm run start:dev

# Terminal 2 - Frontend
cd client
npm run dev
```

2. **Mode production**

```
# Build du frontend
cd client
npm run build

# Démarrage du backend en mode production
cd ../server
npm run build
npm run start:prod
```

L'application sera accessible à l'adresse http://localhost:5173 en mode développement.

## 🧪 Tests et méthodologie TDD

Le projet suit une approche **Test-Driven Development (TDD)**, où les tests sont écrits avant l'implémentation du code. Cette méthodologie garantit une meilleure qualité de code, une couverture de test complète et une conception plus robuste.

### Cycle TDD suivi

1. **Red** : Écriture d'un test qui échoue
2. **Green** : Implémentation du code minimum pour faire passer le test
3. **Refactor** : Amélioration du code sans changer son comportement

### Tests unitaires (backend)

Les tests unitaires sont réalisés avec **Jest**, le framework de test inclus avec NestJS :

```bash
cd server
npm run test          # Exécuter les tests unitaires
npm run test:watch    # Exécuter les tests en mode watch (pour le TDD)
npm run test:cov      # Exécuter les tests avec couverture
npm run test:debug    # Exécuter les tests en mode debug
```

### Tests E2E (frontend)

Les tests end-to-end sont réalisés avec **Playwright**, permettant de tester l'interface utilisateur dans différents navigateurs :

```bash
cd client
npm run test:e2e          # Exécuter les tests E2E
npm run test:e2e:ui       # Exécuter les tests avec interface visuelle
npm run test:e2e:debug    # Exécuter les tests en mode debug
npm run test:e2e:codegen  # Générer des tests automatiquement
```

Playwright permet de tester sur plusieurs navigateurs simultanément :

- Chromium
- Firefox
- WebKit (Safari)

## 🧹 Standards de code et CI/CD

Le projet utilise plusieurs outils pour maintenir une qualité de code élevée et assurer l'intégration continue.

### Formattage et linting

Le code est maintenu propre et cohérent grâce à des outils de formatage et de linting :

```bash
# Formater tout le code (client et serveur)
npm run format

# Linter tout le code (client et serveur)
npm run lint

# Formater uniquement le code client
npm run format:client

# Formater uniquement le code serveur
npm run format:server
```

### Hooks Git avec Husky

Le projet utilise **Husky** pour automatiser les vérifications de qualité de code à chaque étape du workflow Git :

#### 🪝 Hook pre-commit

Ce hook s'exécute automatiquement avant chaque commit et effectue les actions suivantes :

```bash
# 1. Formatage automatique du code
npm run format

# 2. Vérification du code backend
npm run lint:server

# 3. Vérification du code frontend
npm run lint:client
```

Les fichiers sont automatiquement ajoutés à l'index Git après le formatage, ce qui assure que le code commité est toujours correctement formaté.

#### 🪝 Hook commit-msg

Ce hook vérifie que chaque message de commit respecte les conventions définies par CommitLint :

```bash
npx --no -- commitlint --edit $1
```

Format des messages de commit attendus :

```
type(scope): description

# Exemples:
feat(auth): ajouter l'authentification Google
fix(chat): corriger le défilement automatique des messages
docs(readme): mettre à jour la documentation d'installation
```

Types autorisés : `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

Ces hooks garantissent que chaque contribution au projet maintient les standards de qualité définis, évitant ainsi l'accumulation de dette technique au fil du temps.

Cette version améliorée :

1. Détaille exactement ce que font vos hooks Husky en se basant sur les fichiers `.husky/pre-commit` et `.husky/commit-msg`
2. Montre le format attendu des messages de commit avec des exemples concrets
3. Liste les types de commit valides
4. Explique le bénéfice de ces hooks dans le contexte du développement
5. Utilise une mise en forme plus claire avec des emojis et des sous-sectionsCette version améliorée :

6. Détaille exactement ce que font vos hooks Husky en se basant sur les fichiers `.husky/pre-commit` et `.husky/commit-msg`
7. Montre le format attendu des messages de commit avec des exemples concrets
8. Liste les types de commit valides
9. Explique le bénéfice de ces hooks dans le contexte du développement
10. Utilise une mise en forme plus claire avec des emojis et des sous-sections

### GitHub Actions Workflow

Le projet dispose d'un workflow d'intégration continue qui s'exécute automatiquement à chaque push ou pull request vers les branches main et develop :

1. **Vérification de la qualité du code**

   - Formatage et linting du code
   - Vérification des dépendances
   - Tests unitaires du serveur

2. **Exécution des tests Jest**

   - Génération de rapports de couverture
   - Archivage des résultats

3. **Tests End-to-End**

   - Installation des navigateurs Playwright
   - Exécution des tests E2E
   - Archivage des rapports et captures d'écran

Ce workflow garantit que chaque contribution maintient les standards de qualité du projet et n'introduit pas de régressions.

## 📂 Structure du projet

Frontend

```
client/
├── public/              # Ressources statiques
├── src/
│   ├── assets/          # Images, polices, etc.
│   ├── components/      # Composants réutilisables
│   │   ├── auth/        # Composants d'authentification
│   │   ├── chat/        # Composants de chat
│   │   ├── common/      # Éléments UI communs
│   │   └── layout/      # Structure de page
│   ├── interfaces/      # Types et interfaces TypeScript
│   ├── routes/          # Configuration des routes
│   ├── stores/          # Magasins Pinia
│   ├── utils/           # Fonctions utilitaires
│   └── views/           # Composants de page
├── .env                 # Variables d'environnement
└── vite.config.ts       # Configuration de Vite
```

Backend

```
server/
├── src/
│   ├── auth/            # Module d'authentification
│   │   ├── dto/         # Objets de transfert de données
│   │   ├── guards/      # Gardes d'authentification
│   │   └── strategies/  # Stratégies Passport
│   ├── conversation/    # Module de conversations
│   │   ├── dto/         # DTOs pour conversations
│   │   └── entities/    # Entité Conversation
│   ├── infrastructure/  # Adaptateurs externes
│   │   └── adapters/    # Adaptateur pour l'API Gemini
│   ├── message/         # Module de messages
│   │   ├── dto/         # DTOs pour messages
│   │   └── entities/    # Entité Message
│   ├── user/            # Module utilisateur
│   │   ├── dto/         # DTOs pour utilisateurs
│   │   └── entities/    # Entité User
│   ├── app.module.ts    # Module racine
│   └── main.ts          # Point d'entrée de l'application
├── .env                 # Variables d'environnement
└── nest-cli.json        # Configuration NestJS
```

## 🔒 Sécurité

- Authentification : Session basée sur cookies sécurisés
- Hachage des mots de passe : Utilisation de bcrypt
- Validation des entrées : Validation complète via class-validator
- Protection CSRF : Gestion automatique par NestJS
- Contrôle d'accès : Gardes d'authentification sur les routes protégées

## 📚 Documentation

La documentation de l'API est disponible via Swagger UI à l'adresse /api/docs lorsque l'application est en cours d'exécution.

## 🤝 Contribution

Pour contribuer au projet:

1. Créez une branche pour votre fonctionnalité
2. Ajoutez des tests pour les nouvelles fonctionnalités
3. Assurez-vous que tous les tests passent
4. Créez une pull request avec une description détaillée

## 📜 Licence

Ce projet est sous licence Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0). Cette licence permet le partage et l'adaptation du code pour un usage non-commercial uniquement, avec attribution obligatoire et partage sous les mêmes conditions.

Toute utilisation commerciale sans autorisation écrite explicite est strictement interdite et pourra faire l'objet de poursuites judiciaires.

Voir le fichier LICENSE pour tous les détails.

---

Développé avec ❤️ par Théotime - © 2025
