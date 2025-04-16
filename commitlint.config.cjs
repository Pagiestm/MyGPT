module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Types de commits autorisés
    'type-enum': [
      2,
      'always',
      [
        'build', // Modifications du système de build ou dépendances externes
        'chore', // Tâches de maintenance diverses
        'ci', // Modifications de la configuration CI
        'docs', // Documentation uniquement
        'feat', // Ajout d'une nouvelle fonctionnalité
        'fix', // Correction d'un bug
        'perf', // Amélioration de performance
        'refactor', // Refactorisation de code
        'revert', // Annulation d'un commit précédent
        'style', // Changements de formatage sans impact sur le code
        'test', // Ajout ou correction de tests
      ],
    ],

    // Format du type
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],

    // Format du scope (optionnel)
    'scope-case': [2, 'always', 'lower-case'],

    // Format du sujet
    'subject-empty': [2, 'never'],
    'subject-case': [0], // Désactivé pour plus de flexibilité
    'subject-full-stop': [2, 'never', '.'],
    'subject-min-length': [2, 'always', 3],
    'subject-max-length': [2, 'always', 100],

    // Format de l'en-tête complet
    'header-max-length': [2, 'always', 100],

    // Format du corps du message
    'body-leading-blank': [2, 'always'],
    'body-max-line-length': [2, 'always', 100],

    // Format du footer
    'footer-leading-blank': [2, 'always'],
    'footer-max-line-length': [2, 'always', 100],
  },
};
