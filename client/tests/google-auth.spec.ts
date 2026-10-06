import { test, expect } from '@playwright/test';
import { fakeApi } from './support/fakeApi';

test.describe('Connexion Google', () => {
  test('le bouton reste caché quand l’instance ne configure pas Google', async ({ page }) => {
    await fakeApi(page);
    await page.goto('/login');

    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Google/ })).toBeHidden();
  });

  test('le bouton mène à Google quand l’instance le propose', async ({ page }) => {
    await fakeApi(page, { googleSignIn: true });
    await page.goto('/login');

    const button = page.getByRole('link', { name: 'Se connecter avec Google' });
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute('href', /\/auth\/google$/);
    await expect(button.locator('svg path[fill="#4285F4"]')).toBeVisible();
  });

  test('l’inscription propose aussi Google', async ({ page }) => {
    await fakeApi(page, { googleSignIn: true });
    await page.goto('/register');

    await expect(page.getByRole('link', { name: "S'inscrire avec Google" })).toBeVisible();
  });
});
