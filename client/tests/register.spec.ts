import { test, expect } from '@playwright/test';
import {
    generateRandomEmail,
    generateRandomPassword,
    generateRandomPseudo
} from '../utils/tests/generators';

test.describe('Inscription utilisateur', () => {
    // Hook avant chaque test
    test.beforeEach(async ({ page }) => {
        // Aller sur la page d'inscription
        await page.goto('/register');

        // Vérifier que nous sommes sur la bonne page
        await expect(
            page.getByRole('heading', { name: 'Inscription' })
        ).toBeVisible();
        await expect(
            page.getByText('Créez votre compte personnel')
        ).toBeVisible();
    });

    test("Affichage correct du formulaire d'inscription", async ({ page }) => {
        // Vérifier les champs du formulaire
        await expect(page.getByLabel('Email')).toBeVisible();
        await expect(page.getByLabel('Pseudo')).toBeVisible();
        await expect(page.getByLabel('Mot de passe')).toBeVisible();

        // Vérifier le bouton d'inscription
        await expect(
            page.getByRole('button', { name: "S'inscrire" })
        ).toBeVisible();

        // Vérifier le lien vers la connexion
        await expect(
            page.getByRole('link', { name: 'Se connecter' })
        ).toBeVisible();
    });

    test('Validation des champs du formulaire', async ({ page }) => {
        // Tenter de s'inscrire avec des champs vides
        await page.getByRole('button', { name: "S'inscrire" }).click();

        // Vérifier les messages d'erreur pour les champs obligatoires
        await expect(page.getByText("L'email est requis")).toBeVisible();
        await expect(page.getByText('Le pseudo est requis')).toBeVisible();
        await expect(
            page.getByText('Le mot de passe est requis')
        ).toBeVisible();

        // Tester l'email invalide
        await page.getByLabel('Email').fill('email-invalide');
        await page.getByLabel('Email').blur();
        await expect(page.getByText('Email invalide')).toBeVisible();

        // Tester un pseudo trop court
        await page.getByLabel('Pseudo').fill('ab');
        await page.getByLabel('Pseudo').blur();
        await expect(
            page.getByText(/pseudo doit contenir entre/)
        ).toBeVisible();

        // Tester un mot de passe invalide (trop court)
        await page.getByLabel('Mot de passe').fill('court');
        await page.getByLabel('Mot de passe').blur();
        await expect(
            page.getByText(/mot de passe doit contenir au minimum 10/)
        ).toBeVisible();

        // Tester un mot de passe sans caractères spéciaux
        await page.getByLabel('Mot de passe').fill('motdepasselong');
        await page.getByLabel('Mot de passe').blur();
        await expect(
            page.getByText(/mot de passe doit contenir au moins 1 majuscule/)
        ).toBeVisible();
    });

    test('Inscription réussie et redirection', async ({ page }) => {
        // Générer des données de test valides
        const email = generateRandomEmail();
        const pseudo = generateRandomPseudo();
        const password = generateRandomPassword();

        // Remplir le formulaire avec des données valides
        await page.getByLabel('Email').fill(email);
        await page.getByLabel('Pseudo').fill(pseudo);
        await page.getByLabel('Mot de passe').fill(password);

        // Interception de la requête API pour simuler une réponse réussie
        await page.route('**/users/register', async (route) => {
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Inscription réussie!' })
            });
        });

        // Soumettre le formulaire
        await page.getByRole('button', { name: "S'inscrire" }).click();

        // Vérifier le toast de succès
        await expect(page.getByText('Inscription réussie !')).toBeVisible();

        // Vérifier la redirection vers la page de connexion
        await expect(page).toHaveURL(/.*\/login/);
    });

    test('Gestion des erreurs - Email déjà utilisé', async ({ page }) => {
        // Remplir le formulaire
        await page.getByLabel('Email').fill('test@example.com');
        await page.getByLabel('Pseudo').fill('testuser');
        await page.getByLabel('Mot de passe').fill('TestPassword123!');

        // Interception de la requête API pour simuler une erreur
        await page.route('**/users/register', async (route) => {
            await route.fulfill({
                status: 409,
                contentType: 'application/json',
                body: JSON.stringify({
                    message: 'Un utilisateur avec cet email existe déjà'
                })
            });
        });

        // Soumettre le formulaire
        await page.getByRole('button', { name: "S'inscrire" }).click();

        // Vérifier le message d'erreur
        await expect(
            page.getByText('Un utilisateur avec cet email existe déjà')
        ).toBeVisible();
    });

    test('Gestion des erreurs - Pseudo déjà utilisé', async ({ page }) => {
        // Remplir le formulaire
        await page.getByLabel('Email').fill('nouveau@example.com');
        await page.getByLabel('Pseudo').fill('existant');
        await page.getByLabel('Mot de passe').fill('TestPassword123!');

        // Interception de la requête API pour simuler une erreur
        await page.route('**/users/register', async (route) => {
            await route.fulfill({
                status: 409,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Ce pseudo est déjà utilisé' })
            });
        });

        // Soumettre le formulaire
        await page.getByRole('button', { name: "S'inscrire" }).click();

        // Vérifier le message d'erreur
        await expect(
            page.getByText('Ce pseudo est déjà utilisé')
        ).toBeVisible();
    });
});
