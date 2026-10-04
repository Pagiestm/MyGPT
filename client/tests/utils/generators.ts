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
  const randomSpecial = specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  const randomNumber = Math.floor(Math.random() * 10).toString();
  const randomUppercase = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const randomChars = Math.random().toString(36).substring(2, 11);
  const combined = `${randomUppercase}${randomNumber}${randomSpecial}${randomChars}`;
  const shuffled = combined
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('');

  return shuffled;
}

export function generateRandomPseudo(): string {
  const random = Math.random().toString(36).substring(2, 10);
  return `user_${random}`;
}
