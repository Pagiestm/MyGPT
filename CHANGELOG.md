# [1.2.0](https://github.com/Pagiestm/MyGPT/compare/v1.1.0...v1.2.0) (2026-10-07)

### Bug Fixes

- **http:** faire confiance au proxy en production ([06e3109](https://github.com/Pagiestm/MyGPT/commit/06e31095516a0ba23f058da1e9e86166dc7525e4))

### Features

- **ops:** servir le client et l'API sur une seule origine ([294a94c](https://github.com/Pagiestm/MyGPT/commit/294a94c811c3a1d39ce6089ae1afc495feb9dd31))

# [1.1.0](https://github.com/Pagiestm/MyGPT/compare/v1.0.0...v1.1.0) (2026-10-07)

### Features

- **ops:** accepter DATABASE_URL et séparer les sondes de santé ([b22d484](https://github.com/Pagiestm/MyGPT/commit/b22d4848d7c524fb79747fd1d0341b7c1488f812))
- **ops:** décrire le déploiement Render en blueprint ([72665cd](https://github.com/Pagiestm/MyGPT/commit/72665cd45237a0003e7db3b9e5d36e9dd380ebc2))

# 1.0.0 (2026-10-06)

### Bug Fixes

- **conversation:** stop exposing owner credentials on public share route ([b3256bc](https://github.com/Pagiestm/MyGPT/commit/b3256bcc407a346745a5b9bfa5cdff49b3e4f08f))
- **home:** décrire le produit tel qu'il est ([88abeb2](https://github.com/Pagiestm/MyGPT/commit/88abeb228c409af7d8b52fd4b5d8bf8c4cf5fdf9))
- **http:** réparer l'inscription et durcir la validation des entrées ([910d417](https://github.com/Pagiestm/MyGPT/commit/910d417bbe2e26492b37f31d7aef0968b98aa850))
- **ui:** tenir dans un écran de 320 px ([d3a208e](https://github.com/Pagiestm/MyGPT/commit/d3a208efe47503bc5a469eac0c54f8530ead587f))

### Features

- add chat components and functionality ([bf5f88a](https://github.com/Pagiestm/MyGPT/commit/bf5f88af6793005675f848ea1b99c5867a54f1d4))
- add search functionality to conversation view and enhance message display ([a64ec6f](https://github.com/Pagiestm/MyGPT/commit/a64ec6fe644eb75a98a19efc396a8ef48f106cb9))
- **ai:** exécuter les modèles en WebGPU dans le navigateur ([1ad7190](https://github.com/Pagiestm/MyGPT/commit/1ad71906a32028988280669478abf6c7f0773680))
- **auth:** connexion avec Google ([600215b](https://github.com/Pagiestm/MyGPT/commit/600215b865693a41286d6e9bdc3820d63e052152))
- **auth:** enhance login flow with redirect support for shared conversations ([e46d963](https://github.com/Pagiestm/MyGPT/commit/e46d9633c53a83994221956e60716b5acfa27a03))
- **auth:** improve authentication system with persisted state ([48f171a](https://github.com/Pagiestm/MyGPT/commit/48f171acd278d001d9df8241a1c12fb4470d298c))
- **auth:** récupérer et changer son mot de passe ([1296a0d](https://github.com/Pagiestm/MyGPT/commit/1296a0d573d8675e516919054f2e4d35cfc9d416))
- **chat:** exporter une conversation en Markdown ([76a2909](https://github.com/Pagiestm/MyGPT/commit/76a2909c9451696f25715bd5c4aa3ce9e8e14fa4))
- **chat:** improve message editing and update handling in ConversationDetail ([9243a6a](https://github.com/Pagiestm/MyGPT/commit/9243a6a9bd20016c9113fa78ea1d39a7f5de8fd6))
- **chat:** mettre les conversations à la corbeille ([abc36a1](https://github.com/Pagiestm/MyGPT/commit/abc36a14b28b428b23dbe3520a99e4d7b9e9a24a))
- **client:** add streaming chat, organization and personalization ([bd805a1](https://github.com/Pagiestm/MyGPT/commit/bd805a1ec5ef32f10e6afb8aded6ccd1b8bb4ad0))
- **client:** rebuild frontend with nuxt ui and a clean architecture ([64178f0](https://github.com/Pagiestm/MyGPT/commit/64178f066f3e35eed5221953c77831381cc133ef))
- **client:** redesign landing, auth and chat with animations ([85a2685](https://github.com/Pagiestm/MyGPT/commit/85a26855fe84cce2e075dab389a513054df8ab5c))
- **deploy:** images de production, sonde de santé et build en CI ([ff533b6](https://github.com/Pagiestm/MyGPT/commit/ff533b6e4190618fddb9ba22485e3f48761cfe55))
- **docs:** add docs ([cacdcc5](https://github.com/Pagiestm/MyGPT/commit/cacdcc5f6399ef8cca5fb0fdbfafe66e0f00e7ea))
- **docs:** enhance README with application overview and testing examples ([434c4a8](https://github.com/Pagiestm/MyGPT/commit/434c4a82db6ff2119e9bb298a994c0e33c0888a3))
- **docs:** update README layout and remove unused styles ([e9b20d5](https://github.com/Pagiestm/MyGPT/commit/e9b20d560de8fff550d556ae4615386becfc1a5f))
- enhance chat layout with responsive sidebar and mobile navigation ([b83b4f8](https://github.com/Pagiestm/MyGPT/commit/b83b4f8d42dd99d588d96090bea13cb9b70552d7))
- Implement conversation and message management system ([d917eff](https://github.com/Pagiestm/MyGPT/commit/d917effc2ef8abcf5bee9e93ed68919646f299d2))
- Implement shared conversation saving and retrieval functionality ([30c2c77](https://github.com/Pagiestm/MyGPT/commit/30c2c770ea5c7329a98beb33487d65c370b0b440))
- initialize NestJS application with authentication and user management ([da280d4](https://github.com/Pagiestm/MyGPT/commit/da280d45b68ff14472522248dc11bb826310cb91))
- **knowledge:** accepter les PDF ([6405a78](https://github.com/Pagiestm/MyGPT/commit/6405a787b7b1832e858980bdf574db0afd16af70))
- **knowledge:** chercher un passage dans ses documents ([b50355a](https://github.com/Pagiestm/MyGPT/commit/b50355a12ffc0401240e2455df2114392a3434c1))
- **models:** exposer les capacités de chaque modèle ([92fa9ec](https://github.com/Pagiestm/MyGPT/commit/92fa9ec4c32ba1a51321bacf2292fd783bc6a897))
- **ops:** sauvegarder la base et servir en HTTPS ([2f211fb](https://github.com/Pagiestm/MyGPT/commit/2f211fb0dc995823c35e5aadda831da087ab68fa))
- **security:** migrations, sessions persistantes, CSRF et limitation de débit ([8ce64cd](https://github.com/Pagiestm/MyGPT/commit/8ce64cd249b221cd4124ca6336516985b6a53ed0))
- **server:** retry gemini on transient errors and use gemini-3.8-flash ([d32cb54](https://github.com/Pagiestm/MyGPT/commit/d32cb548c30026f5ca4f8a4da0a2bf95fb473d76))
- **server:** stream chat answers and add folders, attachments and preferences ([e8607dd](https://github.com/Pagiestm/MyGPT/commit/e8607dd8f73601aa82e6f69c7c98de3e9f2f7a87))
- **tests:** add client build step and configure web server for Playwright tests ([6f9ceeb](https://github.com/Pagiestm/MyGPT/commit/6f9ceebabefafebd80559063e9965661d1b316cb))
- **tests:** add comprehensive user authentication tests with random data generation ([bdac91c](https://github.com/Pagiestm/MyGPT/commit/bdac91c7e82b355940f0cba10c88c0466618375b))
- **tests:** add conversation tests (create, modify, delete, search) ([488b30d](https://github.com/Pagiestm/MyGPT/commit/488b30df67f46ba6d410016f20b923fc6b4e81ee))
- **tests:** add message functionality tests including sending, editing, and searching messages ([78d2805](https://github.com/Pagiestm/MyGPT/commit/78d280528db6365e3867161ad47cf16b62be8f1d))
- **tests:** enhance login tests with improved session handling and error validation ([d284547](https://github.com/Pagiestm/MyGPT/commit/d284547efb062be725b5ab1fab3f6bf8e354caf9))
- **tests:** integrate Playwright for end-to-end testing and add demo tests ([a1eed63](https://github.com/Pagiestm/MyGPT/commit/a1eed63116bae226da91b0760b57a0ce20f79383))
- **user:** add account deletion functionality with confirmation modal + unit test ([712c23c](https://github.com/Pagiestm/MyGPT/commit/712c23c783a973a7f2150e39be510c1939f08de3))
- **user:** implement user pseudo update functionality with validation ([30aca66](https://github.com/Pagiestm/MyGPT/commit/30aca66cc997ae94409a02afb7c4f01a2b788f0d))
