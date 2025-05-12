import { test, expect } from '@playwright/test';

test.describe('Authentification utilisateur', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');

        await expect(
            page.getByRole('heading', { name: 'Connexion' })
        ).toBeVisible();
        await expect(
            page.getByText('Accédez à votre espace personnel')
        ).toBeVisible();
    });

    test('Affichage correct du formulaire de connexion', async ({ page }) => {
        await expect(page.getByLabel('Email')).toBeVisible();
        await expect(page.getByLabel('Mot de passe')).toBeVisible();

        await expect(
            page.getByRole('button', { name: 'Se connecter' })
        ).toBeVisible();

        await expect(
            page.getByRole('link', { name: 'Créer un compte' })
        ).toBeVisible();
    });

    test('Validation des champs du formulaire', async ({ page }) => {
        await page.getByRole('button', { name: 'Se connecter' }).click();

        await expect(page.getByText("L'email est requis")).toBeVisible();
        await expect(
            page.getByText('Le mot de passe est requis')
        ).toBeVisible();

        await page.getByLabel('Email').fill('email-invalide');
        await page.getByLabel('Email').blur();
        await expect(page.getByText('Email invalide')).toBeVisible();

        await page.getByLabel('Mot de passe').fill('court');
        await page.getByLabel('Mot de passe').blur();
        await expect(
            page.getByText(/mot de passe doit contenir au minimum 10/)
        ).toBeVisible();
    });

    test('Connexion réussie et redirection', async ({ page }) => {
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

        await page.route('**/conversations', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
        });

        await page.getByLabel('Email').fill('test@example.com');
        await page.getByLabel('Mot de passe').fill('Password123!');

        await page.getByRole('button', { name: 'Se connecter' }).click();

        await expect(page.getByText('Connexion réussie !')).toBeVisible();

        await expect(page).toHaveURL(/.*\/chat/, { timeout: 10000 });
    });

    test('Redirection vers une conversation partagée après connexion', async ({
        page
    }) => {
        await page.goto('/login?redirect=/chat/shared/123456abcdef');

        await page.getByLabel('Email').fill('test@example.com');
        await page.getByLabel('Mot de passe').fill('Password123!');

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

        await page.getByRole('button', { name: 'Se connecter' }).click();

        await expect(page).toHaveURL(/.*\/chat\/shared\/123456abcdef/);
    });

    test('Erreur de connexion - Identifiants incorrects', async ({ page }) => {
        await page.route('**/auth/login', async (route) => {
            const json = await route.request().postDataJSON();
            console.log('Credentials sent:', json);

            await route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: JSON.stringify({
                    message: 'Identifiants invalides',
                    error: 'Échec de la connexion. Vérifiez vos identifiants.'
                })
            });
        });

        await page.getByLabel('Email').fill('test@example.com');
        await page.getByLabel('Mot de passe').fill('MotDePasseIncorrect123!');

        await page.getByRole('button', { name: 'Se connecter' }).click();

        await page.waitForTimeout(500);

        const errorMessageOptions = [
            'Échec de la connexion. Vérifiez vos identifiants.',
            'Identifiants invalides',
            'Identifiants incorrects.',
            'Email ou mot de passe incorrect'
        ];

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
        await page.getByRole('link', { name: 'Créer un compte' }).click();

        await expect(page).toHaveURL(/.*\/register/);
    });
});
