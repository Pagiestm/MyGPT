import { expect, test } from '@playwright/test';
import { conversation, fakeApi } from './support/fakeApi';

test.describe('Appareil tactile', () => {
  test('le menu d’une conversation est atteignable sans survol', async ({ page }) => {
    await fakeApi(page, {
      user: { pseudo: 'alice', email: 'alice@example.com' },
      conversations: [conversation('c1', 'Liste de courses')],
    });
    await page.goto('/chat');
    await page.getByRole('button', { name: 'Ouvrir la barre latérale' }).click();

    const actions = page.getByRole('button', { name: 'Actions pour Liste de courses' });
    await expect(actions).toBeVisible();
    await expect(actions).toHaveCSS('opacity', '1');

    await actions.click();
    await expect(page.getByRole('menuitem', { name: 'Renommer' })).toBeVisible();
  });
});
