import { expect, test } from '@playwright/test';
import { fakeApi } from './support/fakeApi';

test.describe('Navigation', () => {
  test("la page d'accueil présente l'application", async ({ page }) => {
    await fakeApi(page);
    await page.goto('/');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Posez votre question.' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Inscription gratuite' })).toHaveAttribute(
      'href',
      '/register',
    );
    await expect(page.getByRole('img', { name: /Démonstration de MyGPT/ })).toBeVisible();
  });

  test("le menu de l'accueil défile jusqu'aux sections", async ({ page }) => {
    await fakeApi(page);
    await page.goto('/');
    const sections = page.getByRole('navigation', { name: 'Sections' });

    await sections.getByRole('link', { name: 'FAQ' }).click();
    await expect(page).toHaveURL(/#faq$/);
    await expect(page.locator('#faq')).toBeInViewport();

    await sections.getByRole('link', { name: 'Fonctionnalités' }).click();
    await expect(page.locator('#features')).toBeInViewport();
  });

  test("garde la question tapée sur l'accueil pendant la connexion", async ({ page }) => {
    await fakeApi(page);
    await page.goto('/');

    await page.getByPlaceholder('Demandez à MyGPT…').pressSequentially('Comment marche Docker ?');
    await page.getByRole('button', { name: 'Envoyer la question' }).click();
    await expect(page).toHaveURL(/\/login\?redirect=(%2F|\/)chat$/);

    await page.getByLabel('Email').fill('alice@example.com');
    await page.getByLabel('Mot de passe').fill('Password123!');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await expect(page).toHaveURL(/\/chat$/);
    await expect(page.getByPlaceholder('Écrivez votre message...')).toHaveValue(
      'Comment marche Docker ?',
    );
  });

  test('un visiteur connecté voit le lien vers le chat', async ({ page }) => {
    await fakeApi(page, { user: { pseudo: 'alice', email: 'alice@example.com' } });
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Ouvrir le chat' }).first()).toBeVisible();
  });

  for (const path of ['/chat', '/library', '/settings']) {
    test(`${path} demande une connexion`, async ({ page }) => {
      await fakeApi(page);
      await page.goto(path);
      await expect(page).toHaveURL(/\/login\?redirect=/);
    });
  }

  test('les anciennes URL sont redirigées', async ({ page }) => {
    await fakeApi(page, { user: { pseudo: 'alice', email: 'alice@example.com' } });
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/settings$/);
    await page.goto('/chat/saved');
    await expect(page).toHaveURL(/\/library$/);
  });

  test('une URL inconnue affiche la page 404', async ({ page }) => {
    await fakeApi(page);
    await page.goto('/nimporte/quoi');
    await expect(page.getByRole('heading', { name: "Cette page n'existe pas" })).toBeVisible();
  });
});
