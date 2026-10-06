import { test, expect } from '@playwright/test';
import { fakeApi } from './support/fakeApi';

const signedIn = { user: { pseudo: 'alice', email: 'alice@example.com' } };

const isWebllmBundle = (url: string) => /web-llm|webllm|\/lib-/i.test(url);

test.describe('Modèles', () => {
  test('la bibliothèque WebGPU ne se charge pas au démarrage du chat', async ({ page }) => {
    const heavy: string[] = [];
    page.on('request', (request) => {
      if (isWebllmBundle(request.url())) heavy.push(request.url());
    });

    await fakeApi(page, signedIn);
    await page.goto('/chat');
    await expect(page.getByRole('button', { name: "Modèle d'IA" })).toBeVisible();

    expect(heavy).toHaveLength(0);
  });

  test('le sélecteur ne propose que des modèles du navigateur', async ({ page }) => {
    await fakeApi(page, signedIn);
    await page.goto('/chat');

    await page.getByRole('button', { name: "Modèle d'IA" }).click();

    await expect(page.getByRole('option', { name: /Llama 3\.2 3B/ })).toBeVisible();
    await expect(page.getByRole('option', { name: /Qwen 2\.5 Coder 7B/ })).toBeVisible();
  });

  test('le sélecteur décrit chaque modèle sans avoir à l’ouvrir ailleurs', async ({ page }) => {
    await fakeApi(page, signedIn);
    await page.goto('/chat');

    await page.getByRole('button', { name: "Modèle d'IA" }).click();

    const option = page.getByRole('option', { name: /Llama 3\.2 3B/ });
    await expect(option).toContainText('Bon compromis');
    await expect(option).toContainText('Suit bien les consignes');
    await expect(option).toContainText('2,2 Go');
  });

  test('les capacités du modèle choisi sont consultables depuis le chat', async ({ page }) => {
    await fakeApi(page, signedIn);
    await page.goto('/chat');

    await page.getByRole('button', { name: 'Capacités de Llama 3.2 3B' }).click();

    await expect(page.getByText('3 milliards de paramètres')).toBeVisible();
    await expect(page.getByText('Points forts')).toBeVisible();
    await expect(
      page.getByText('Moins précis que les modèles de 7 milliards et plus'),
    ).toBeVisible();
    await expect(page.getByText('4 k jetons')).toBeVisible();
  });

  test('les réglages indiquent ce qui est déjà téléchargé', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await fakeApi(page, signedIn);
    await page.goto('/settings');

    await expect(page.getByText('à télécharger').first()).toBeVisible({ timeout: 30000 });
    expect(errors).toEqual([]);
  });
});
