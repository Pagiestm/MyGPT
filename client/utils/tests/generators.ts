/**
 * Génère un email aléatoire
 */
export function generateRandomEmail(): string {
    const random = Math.random().toString(36).substring(2, 10);
    return `test-${random}@example.com`;
}

/**
 * Génère un mot de passe aléatoire respectant les critères
 * - Au moins 10 caractères
 * - Au moins 1 majuscule
 * - Au moins 1 chiffre
 * - Au moins 1 caractère spécial
 */
export function generateRandomPassword(): string {
    const specialChars = '!@#$%^&*()_+-=[]{}\\|;:\'",.<>/?';
    const randomSpecial = specialChars.charAt(
        Math.floor(Math.random() * specialChars.length)
    );
    const randomNumber = Math.floor(Math.random() * 10).toString();
    const randomUppercase = String.fromCharCode(
        65 + Math.floor(Math.random() * 26)
    );

    // Générer une chaîne aléatoire pour le reste du mot de passe
    const randomChars = Math.random().toString(36).substring(2, 11);

    // Combinez-les tous ensemble et mélangez
    const combined = `${randomUppercase}${randomNumber}${randomSpecial}${randomChars}`;
    const shuffled = combined
        .split('')
        .sort(() => 0.5 - Math.random())
        .join('');

    return shuffled;
}

/**
 * Génère un pseudo aléatoire respectant les critères
 */
export function generateRandomPseudo(): string {
    const random = Math.random().toString(36).substring(2, 10);
    return `user_${random}`;
}
