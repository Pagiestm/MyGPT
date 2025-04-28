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
        // Interception de la requête API pour simuler une réponse réussie
        await page.route('**/auth/login', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    message: 'Connexion réussie',
                    user: {
                        id: 'test-id',
                        pseudo: 'testuser',
                        email: 'test@example.com'
                    }
                })
            });
        });

        // Interception de la vérification de session (qui peut être appelée après la connexion)
        await page.route('**/auth/check-session', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    valid: true,
                    user: {
                        id: 'test-id',
                        pseudo: 'testuser',
                        email: 'test@example.com'
                    }
                })
            });
        });

        // Interception pour faciliter la redirection
        await page.route('**/conversations', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
        });

        // Remplir le formulaire avec des identifiants valides
        await page.getByLabel('Email').fill('test@example.com');
        await page.getByLabel('Mot de passe').fill('Password123!');

        // Soumettre le formulaire
        await page.getByRole('button', { name: 'Se connecter' }).click();

        // Vérifier le toast de succès
        await expect(page.getByText('Connexion réussie !')).toBeVisible();

        // Augmenter le timeout pour la redirection (certaines applications ont des délais)
        await expect(page).toHaveURL(/.*\/chat/, { timeout: 10000 });
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
        // Interception de la requête API pour simuler une erreur d'authentification
        await page.route('**/auth/login', async (route) => {
            const json = await route.request().postDataJSON();
            console.log('Credentials sent:', json); // Aide au débogage

            await route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: JSON.stringify({
                    message: 'Identifiants invalides',
                    error: 'Échec de la connexion. Vérifiez vos identifiants.'
                })
            });
        });

        // Remplir le formulaire avec des identifiants invalides
        await page.getByLabel('Email').fill('test@example.com');
        await page.getByLabel('Mot de passe').fill('MotDePasseIncorrect123!');

        // Soumettre le formulaire
        await page.getByRole('button', { name: 'Se connecter' }).click();

        // Attendre que le message d'erreur apparaisse
        await page.waitForTimeout(500); // Donner à l'application le temps de traiter l'erreur

        // Vérifier le message d'erreur (adaptez le texte exact à celui utilisé dans votre application)
        const errorMessageOptions = [
            'Échec de la connexion. Vérifiez vos identifiants.',
            'Identifiants invalides',
            'Identifiants incorrects.',
            'Email ou mot de passe incorrect'
        ];

        // Vérifier si l'un des messages d'erreur possibles est visible
        const errorVisible = await errorMessageOptions.reduce(
            async (prev, message) => {
                const isVisible = await prev;
                if (isVisible) return true;

                const locator = page.getByText(message, { exact: false });
                return await locator.isVisible().catch(() => false);
            },
            Promise.resolve(false)
        );

        expect(errorVisible).toBeTruthy();

        // Alternative: prendre une capture d'écran pour déboguer
        if (!errorVisible) {
            await page.screenshot({
                path: 'error-login-debug.png',
                fullPage: true
            });
        }
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
