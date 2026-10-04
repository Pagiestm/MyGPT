import { expect, test } from '@playwright/test';
import { fakeApi } from './support/fakeApi';

test.describe('Navigation', () => {
  test("la page d'accueil présente l'application", async ({ page }) => {
    await fakeApi(page);
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: /Posez la question/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Commencer gratuitement' })).toHaveAttribute(
      'href',
      '/register',
    );
    await expect(page.getByRole('tab', { name: 'Code' })).toBeVisible();
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
