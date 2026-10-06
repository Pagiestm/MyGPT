import { test, expect } from '@playwright/test';
import { fakeApi } from './support/fakeApi';

test.describe('Accueil', () => {
  test('ne promet aucun service d’IA extérieur', async ({ page }) => {
    await fakeApi(page);
    await page.goto('/');

    await expect(page.locator('body')).not.toContainText('Gemini');
    await expect(page.locator('body')).not.toContainText('OpenAI');
  });

  test('annonce ce qui distingue le produit', async ({ page }) => {
    await fakeApi(page);
    await page.goto('/');

    const body = page.locator('body');
    await expect(body).toContainText('navigateur');
    await expect(body).toContainText('abonnement');
  });

  test('la FAQ explique le prérequis WebGPU', async ({ page }) => {
    await fakeApi(page);
    await page.goto('/#faq');

    await page.getByRole('button', { name: /De quoi ai-je besoin/ }).click();

    await expect(page.getByText(/WebGPU/).first()).toBeVisible();
  });
});
