import { test, expect } from '@playwright/test';
import { fakeApi } from './support/fakeApi';

const admin = { user: { pseudo: 'alice', email: 'alice@example.com', role: 'admin' } };
const member = { user: { pseudo: 'bob', email: 'bob@example.com', role: 'user' } };

test.describe('Administration', () => {
  test('un administrateur accède à la page et y voit les deux sections', async ({ page }) => {
    await fakeApi(page, admin);
    await page.goto('/admin');

    await expect(page.getByRole('heading', { name: 'Administration' })).toBeVisible();
    await expect(page.getByText('Comptes et rôles')).toBeVisible();
    await expect(page.getByText('Catalogue des modèles')).toBeVisible();
    await expect(page.getByText('alice@example.com').first()).toBeVisible();
  });

  test('un compte sans droits est renvoyé hors de la page', async ({ page }) => {
    await fakeApi(page, member);
    await page.goto('/admin');

    await expect(page).toHaveURL(/\/chat$/);
  });

  test("l'entrée de menu n'apparaît qu'aux administrateurs", async ({ page }) => {
    await fakeApi(page, member);
    await page.goto('/chat');
    await page.getByRole('button', { name: /bob/i }).click();
    await expect(page.getByRole('menuitem', { name: 'Administration' })).toBeHidden();
  });

  test("les réglages ne contiennent plus l'administration", async ({ page }) => {
    await fakeApi(page, admin);
    await page.goto('/settings');

    await expect(page.getByText('Comptes et rôles')).toBeHidden();
    await expect(page.getByText('Modèles', { exact: true })).toBeVisible();
  });
});
