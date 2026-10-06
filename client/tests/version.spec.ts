import { test, expect } from '@playwright/test';
import { fakeApi } from './support/fakeApi';

const signedIn = { user: { pseudo: 'alice', email: 'alice@example.com' } };

test('la version publiée est visible dans les réglages', async ({ page }) => {
  await fakeApi(page, signedIn);
  await page.goto('/settings');

  await expect(page.getByText(/^MyGPT v\d+\.\d+\.\d+$/)).toBeVisible();
});

test('la version est rappelée sous le compte dans le menu', async ({ page }) => {
  await fakeApi(page, signedIn);
  await page.goto('/chat');

  await page.getByRole('button', { name: 'alice' }).click();

  const menu = page.getByRole('menu');
  await expect(menu.getByText('alice@example.com')).toBeVisible();
  await expect(menu.getByText(/^MyGPT v\d+\.\d+\.\d+$/)).toBeVisible();
});
