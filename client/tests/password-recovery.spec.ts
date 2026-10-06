import { test, expect } from '@playwright/test';
import { fakeApi } from './support/fakeApi';

test.describe('Mot de passe oublié', () => {
  test('le lien reste caché quand l’instance n’envoie pas de courriel', async ({ page }) => {
    await fakeApi(page, { passwordRecovery: false });
    await page.goto('/login');

    await expect(page.getByRole('link', { name: 'Mot de passe oublié ?' })).toBeHidden();
  });

  test('le lien mène au formulaire quand l’instance sait envoyer', async ({ page }) => {
    await fakeApi(page, { passwordRecovery: true });
    await page.goto('/login');

    await page.getByRole('link', { name: 'Mot de passe oublié ?' }).click();

    await expect(page.getByRole('heading', { name: 'Mot de passe oublié' })).toBeVisible();
  });

  test('la réponse ne révèle pas si le compte existe', async ({ page }) => {
    await fakeApi(page, { passwordRecovery: true });
    await page.goto('/mot-de-passe-oublie');

    await page.getByLabel('Email').fill('inconnu@example.com');
    await page.getByRole('button', { name: 'Envoyer le lien' }).click();

    await expect(page.getByText(/Si un compte existe pour cet email/)).toBeVisible();
  });

  test('un lien valide permet de choisir un nouveau mot de passe', async ({ page }) => {
    await fakeApi(page);
    await page.goto('/reinitialiser/jeton-valide');

    await page.locator('input[type="password"]').first().fill('N0uveau@Mdp1');
    await page.getByRole('button', { name: 'Enregistrer' }).click();

    await expect(page).toHaveURL(/\/login/);
  });

  test('un lien périmé le dit au lieu de laisser croire que ça a marché', async ({ page }) => {
    await fakeApi(page);
    await page.goto('/reinitialiser/jeton-perime');

    await page.locator('input[type="password"]').first().fill('N0uveau@Mdp1');
    await page.getByRole('button', { name: 'Enregistrer' }).click();

    await expect(
      page.getByText('Ce lien est expiré ou a déjà servi', { exact: true }),
    ).toBeVisible();
  });
});
