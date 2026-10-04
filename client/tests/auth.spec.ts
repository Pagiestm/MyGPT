import { expect, test } from '@playwright/test';
import { fakeApi } from './support/fakeApi';

test.describe('Connexion', () => {
  test('affiche le formulaire de connexion', async ({ page }) => {
    await fakeApi(page);
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
    await expect(page.getByText('Accédez à votre espace personnel')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Mot de passe')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Créer un compte' })).toBeVisible();
  });

  test('valide les champs avant envoi', async ({ page }) => {
    await fakeApi(page);
    await page.goto('/login');

    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByText("L'email est requis")).toBeVisible();
    await expect(page.getByText('Le mot de passe est requis')).toBeVisible();

    await page.getByLabel('Email').fill('email-invalide');
    await page.getByLabel('Email').blur();
    await expect(page.getByText('Email invalide')).toBeVisible();

    await page.getByLabel('Mot de passe').fill('court');
    await page.getByLabel('Mot de passe').blur();
    await expect(page.getByText(/mot de passe doit contenir au minimum 10/)).toBeVisible();
  });

  test('connecte puis redirige vers le chat', async ({ page }) => {
    await fakeApi(page);
    await page.goto('/login');

    await page.getByLabel('Email').fill('alice@example.com');
    await page.getByLabel('Mot de passe').fill('Password123!');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await expect(page.getByText('Connexion réussie !').first()).toBeVisible();
    await expect(page).toHaveURL(/\/chat$/);
    await expect(page.getByRole('heading', { name: /Bonjour alice/ })).toBeVisible();
  });

  test('revient sur la page demandée après connexion', async ({ page }) => {
    await fakeApi(page);
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login\?redirect=(%2F|\/)settings$/);

    await page.getByLabel('Email').fill('alice@example.com');
    await page.getByLabel('Mot de passe').fill('Password123!');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await expect(page).toHaveURL(/\/settings$/);
  });

  test('affiche le message du serveur si les identifiants sont faux', async ({ page }) => {
    await fakeApi(page, {
      failures: { login: { status: 401, message: 'Email ou mot de passe incorrect' } },
    });
    await page.goto('/login');

    await page.getByLabel('Email').fill('alice@example.com');
    await page.getByLabel('Mot de passe').fill('MauvaisMotDePasse1!');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await expect(page.getByText('Email ou mot de passe incorrect').first()).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("mène à l'inscription", async ({ page }) => {
    await fakeApi(page);
    await page.goto('/login');
    await page.getByRole('link', { name: 'Créer un compte' }).click();
    await expect(page).toHaveURL(/\/register$/);
  });

  test('déconnecte depuis le menu utilisateur', async ({ page }) => {
    const api = await fakeApi(page);
    api.user = api.account;
    await page.goto('/chat');

    await page.getByRole('button', { name: 'alice' }).click();
    await page.getByRole('menuitem', { name: 'Se déconnecter' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await page.goto('/chat');
    await expect(page).toHaveURL(/\/login\?redirect/);
  });
});

test.describe('Inscription', () => {
  test("affiche le formulaire d'inscription", async ({ page }) => {
    await fakeApi(page);
    await page.goto('/register');

    await expect(page.getByRole('heading', { name: 'Inscription' })).toBeVisible();
    await expect(page.getByText('Créez votre compte personnel')).toBeVisible();
    await expect(page.getByLabel('Pseudo')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Se connecter' })).toBeVisible();
  });

  test('valide les champs avant envoi', async ({ page }) => {
    await fakeApi(page);
    await page.goto('/register');

    await page.getByRole('button', { name: "S'inscrire" }).click();
    await expect(page.getByText("L'email est requis")).toBeVisible();
    await expect(page.getByText('Le pseudo est requis')).toBeVisible();
    await expect(page.getByText('Le mot de passe est requis')).toBeVisible();

    await page.getByLabel('Pseudo').fill('ab');
    await page.getByLabel('Pseudo').blur();
    await expect(page.getByText(/pseudo doit contenir entre/)).toBeVisible();

    await page.getByLabel('Mot de passe').fill('motdepasselong');
    await page.getByLabel('Mot de passe').blur();
    await expect(page.getByText(/au moins 1 majuscule/)).toBeVisible();
  });

  test('inscrit puis redirige vers la connexion', async ({ page }) => {
    await fakeApi(page);
    await page.goto('/register');

    await page.getByLabel('Email').fill('bob@example.com');
    await page.getByLabel('Pseudo').fill('bob');
    await page.getByLabel('Mot de passe').fill('Password123!');
    await page.getByRole('button', { name: "S'inscrire" }).click();

    await expect(page.getByText('Inscription réussie !').first()).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  for (const message of [
    'Un utilisateur avec cet email existe déjà',
    'Ce pseudo est déjà utilisé',
  ]) {
    test(`affiche le conflit : ${message}`, async ({ page }) => {
      await fakeApi(page, { failures: { register: { status: 409, message } } });
      await page.goto('/register');

      await page.getByLabel('Email').fill('bob@example.com');
      await page.getByLabel('Pseudo').fill('bob');
      await page.getByLabel('Mot de passe').fill('Password123!');
      await page.getByRole('button', { name: "S'inscrire" }).click();

      await expect(page.getByText(message).first()).toBeVisible();
    });
  }
});
