import { test, expect } from '@playwright/test';

test.describe('Authentification utilisateur', () => {
    // Hook avant chaque test
    test.beforeEach(async ({ page }) => {
        // Aller sur la page de connexion
        await page.goto('/login');

        // Vérifier que nous sommes sur la bonne page
        await expect(
            page.getByRole('heading', { name: 'Connexion' })
        ).toBeVisible();
        await expect(
            page.getByText('Accédez à votre espace personnel')
        ).toBeVisible();
    });

    test('Affichage correct du formulaire de connexion', async ({ page }) => {
        // Vérifier les champs du formulaire
        await expect(page.getByLabel('Email')).toBeVisible();
        await expect(page.getByLabel('Mot de passe')).toBeVisible();

        // Vérifier le bouton de connexion
        await expect(
            page.getByRole('button', { name: 'Se connecter' })
        ).toBeVisible();

        // Vérifier le lien vers l'inscription
        await expect(
            page.getByRole('link', { name: 'Créer un compte' })
        ).toBeVisible();
    });

    test('Validation des champs du formulaire', async ({ page }) => {
        // Tenter de se connecter avec des champs vides
        await page.getByRole('button', { name: 'Se connecter' }).click();

        // Vérifier les messages d'erreur pour les champs obligatoires
        await expect(page.getByText("L'email est requis")).toBeVisible();
        await expect(
            page.getByText('Le mot de passe est requis')
        ).toBeVisible();

        // Tester l'email invalide
        await page.getByLabel('Email').fill('email-invalide');
        await page.getByLabel('Email').blur();
        await expect(page.getByText('Email invalide')).toBeVisible();

        // Tester un mot de passe trop court
        await page.getByLabel('Mot de passe').fill('court');
        await page.getByLabel('Mot de passe').blur();
        await expect(
            page.getByText(/mot de passe doit contenir au minimum 10/)
        ).toBeVisible();
    });

    test('Connexion réussie et redirection', async ({ page }) => {
        // Remplir le formulaire avec des identifiants valides
        await page.getByLabel('Email').fill('test@example.com');
        await page.getByLabel('Mot de passe').fill('Password123!');

        // Interception de la requête API pour simuler une réponse réussie
        await page.route('**/auth/login', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    message: 'Connexion réussie',
                    user: {
                        pseudo: 'testuser'
                    }
                })
            });
        });

        // Soumettre le formulaire
        await page.getByRole('button', { name: 'Se connecter' }).click();

        // Vérifier le toast de succès
        await expect(page.getByText('Connexion réussie !')).toBeVisible();

        // Vérifier la redirection vers le chat
        await expect(page).toHaveURL(/.*\/chat/);
    });

    test('Redirection vers une conversation partagée après connexion', async ({
        page
    }) => {
        // Simuler une URL avec un paramètre de redirection vers une conversation partagée
        await page.goto('/login?redirect=/chat/shared/123456abcdef');

        // Remplir le formulaire avec des identifiants valides
        await page.getByLabel('Email').fill('test@example.com');
        await page.getByLabel('Mot de passe').fill('Password123!');

        // Interception de la requête API pour simuler une réponse réussie
        await page.route('**/auth/login', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    message: 'Connexion réussie',
                    user: {
                        pseudo: 'testuser'
                    }
                })
            });
        });

        // Simuler les données de la conversation partagée pour éviter les erreurs après redirection
        await page.route('**/conversations/shared/*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: '123456abcdef',
                    name: 'Conversation partagée',
                    messages: []
                })
            });
        });

        // Soumettre le formulaire
        await page.getByRole('button', { name: 'Se connecter' }).click();

        // Vérifier la redirection vers la conversation partagée
        await expect(page).toHaveURL(/.*\/chat\/shared\/123456abcdef/);
    });

    test('Erreur de connexion - Identifiants incorrects', async ({ page }) => {
        // Remplir le formulaire avec des identifiants invalides
        await page.getByLabel('Email').fill('test@example.com');
        await page.getByLabel('Mot de passe').fill('MotDePasseIncorrect123!');

        // Interception de la requête API pour simuler une erreur d'authentification
        await page.route('**/auth/login', async (route) => {
            await route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: JSON.stringify({
                    message: 'Identifiants invalides'
                })
            });
        });

        // Soumettre le formulaire
        await page.getByRole('button', { name: 'Se connecter' }).click();

        // Vérifier le message d'erreur
        await expect(
            page.getByText('Échec de la connexion. Vérifiez vos identifiants.')
        ).toBeVisible();
    });

    test('Navigation vers inscription depuis la page de connexion', async ({
        page
    }) => {
        // Cliquer sur le lien d'inscription
        await page.getByRole('link', { name: 'Créer un compte' }).click();

        // Vérifier la redirection vers la page d'inscription
        await expect(page).toHaveURL(/.*\/register/);
    });
});
