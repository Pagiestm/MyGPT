export const userErrorMessages = {
    required: {
        email: "L'email est requis",
        password: 'Le mot de passe est requis',
        pseudo: 'Le pseudo est requis'
    },
    format: {
        email: 'Email invalide'
    },
    password: {
        invalid:
            'Le mot de passe doit contenir au moins 1 majuscule, 1 chiffre et 1 caractère spécial'
    },
    patterns: {
        email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        password:
            /^(?=.*[0-9])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/
    },
    auth: {
        invalidCredentials: 'Échec de la connexion. Vérifiez vos identifiants.'
    },
    length: {
        name: 'Le nom doit contenir entre 1 et 50 caractères',
        pseudo: 'Le pseudo doit contenir entre 3 et 20 caractères',
        password: 'Le mot de passe doit contenir au minimum 10 caractères'
    },
    types: {
        pseudo: 'Le pseudo doit être une chaîne de caractères',
        password: 'Le mot de passe doit être une chaîne de caractères'
    },
    apiErrors: {
        400: 'Données invalides, veuillez vérifier le formulaire.',
        409: "L'inscription a échoué. Vérifiez vos informations ou contactez le support.",
        500: 'Erreur serveur, veuillez réessayer plus tard.',
        unknown: "Une erreur est survenue lors de l'inscription."
    }
};
