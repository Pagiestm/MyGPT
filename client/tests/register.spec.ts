import { test, expect } from '@playwright/test';
import {
    generateRandomEmail,
    generateRandomPassword,
    generateRandomPseudo
} from './utils/generators';

test.describe('Inscription utilisateur', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/register');

        await expect(
            page.getByRole('heading', { name: 'Inscription' })
        ).toBeVisible();
        await expect(
            page.getByText('Créez votre compte personnel')
        ).toBeVisible();
    });

    test("Affichage correct du formulaire d'inscription", async ({ page }) => {
        await expect(page.getByLabel('Email')).toBeVisible();
        await expect(page.getByLabel('Pseudo')).toBeVisible();
        await expect(page.getByLabel('Mot de passe')).toBeVisible();

        await expect(
            page.getByRole('button', { name: "S'inscrire" })
        ).toBeVisible();

        await expect(
            page.getByRole('link', { name: 'Se connecter' })
        ).toBeVisible();
    });

    test('Validation des champs du formulaire', async ({ page }) => {
        await page.getByRole('button', { name: "S'inscrire" }).click();

        await expect(page.getByText("L'email est requis")).toBeVisible();
        await expect(page.getByText('Le pseudo est requis')).toBeVisible();
        await expect(
            page.getByText('Le mot de passe est requis')
        ).toBeVisible();

        await page.getByLabel('Email').fill('email-invalide');
        await page.getByLabel('Email').blur();
        await expect(page.getByText('Email invalide')).toBeVisible();

        await page.getByLabel('Pseudo').fill('ab');
        await page.getByLabel('Pseudo').blur();
        await expect(
            page.getByText(/pseudo doit contenir entre/)
        ).toBeVisible();

        await page.getByLabel('Mot de passe').fill('court');
        await page.getByLabel('Mot de passe').blur();
        await expect(
            page.getByText(/mot de passe doit contenir au minimum 10/)
        ).toBeVisible();

        await page.getByLabel('Mot de passe').fill('motdepasselong');
        await page.getByLabel('Mot de passe').blur();
        await expect(
            page.getByText(/mot de passe doit contenir au moins 1 majuscule/)
        ).toBeVisible();
    });

    test('Inscription réussie et redirection', async ({ page }) => {
        const email = generateRandomEmail();
        const pseudo = generateRandomPseudo();
        const password = generateRandomPassword();

        await page.getByLabel('Email').fill(email);
        await page.getByLabel('Pseudo').fill(pseudo);
        await page.getByLabel('Mot de passe').fill(password);

        await page.route('**/users/register', async (route) => {
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Inscription réussie!' })
            });
        });

        await page.getByRole('button', { name: "S'inscrire" }).click();

        await expect(page.getByText('Inscription réussie !')).toBeVisible();

        await expect(page).toHaveURL(/.*\/login/);
    });

    test('Gestion des erreurs - Email déjà utilisé', async ({ page }) => {
        await page.getByLabel('Email').fill('test@example.com');
        await page.getByLabel('Pseudo').fill('testuser');
        await page.getByLabel('Mot de passe').fill('TestPassword123!');

        await page.route('**/users/register', async (route) => {
            await route.fulfill({
                status: 409,
                contentType: 'application/json',
                body: JSON.stringify({
                    message: 'Un utilisateur avec cet email existe déjà'
                })
            });
        });

        await page.getByRole('button', { name: "S'inscrire" }).click();

        await expect(
            page.getByText('Un utilisateur avec cet email existe déjà')
        ).toBeVisible();
    });

    test('Gestion des erreurs - Pseudo déjà utilisé', async ({ page }) => {
        await page.getByLabel('Email').fill('nouveau@example.com');
        await page.getByLabel('Pseudo').fill('existant');
        await page.getByLabel('Mot de passe').fill('TestPassword123!');

        await page.route('**/users/register', async (route) => {
            await route.fulfill({
                status: 409,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Ce pseudo est déjà utilisé' })
            });
        });

        await page.getByRole('button', { name: "S'inscrire" }).click();

        await expect(
            page.getByText('Ce pseudo est déjà utilisé')
        ).toBeVisible();
    });
});
