import { test, expect } from '@playwright/test';
import { conversation, fakeApi } from './support/fakeApi';

const signedIn = { user: { pseudo: 'alice', email: 'alice@example.com' } };

test.describe('Corbeille', () => {
  test('annonce qu’elle est vide plutôt que de ne rien montrer', async ({ page }) => {
    await fakeApi(page, signedIn);
    await page.goto('/corbeille');

    await expect(page.getByText('La corbeille est vide')).toBeVisible();
  });

  test('restaure une conversation supprimée', async ({ page }) => {
    const trashed = conversation('conv-trash', 'Brouillon jeté');
    await fakeApi(page, { ...signedIn, trashed: [trashed] });
    await page.goto('/corbeille');

    await page.getByRole('button', { name: 'Restaurer Brouillon jeté' }).click();

    await expect(
      page.getByText('« Brouillon jeté » a été restaurée', { exact: true }),
    ).toBeVisible();
    await expect(page.getByText('La corbeille est vide')).toBeVisible();
  });

  test('demande confirmation avant la suppression définitive', async ({ page }) => {
    const trashed = conversation('conv-trash', 'Brouillon jeté');
    await fakeApi(page, { ...signedIn, trashed: [trashed] });
    await page.goto('/corbeille');

    await page.getByRole('button', { name: 'Supprimer définitivement Brouillon jeté' }).click();

    await expect(page.getByText(/Cette action est irréversible/)).toBeVisible();
  });
});
