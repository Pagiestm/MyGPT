import { test, expect } from '@playwright/test';
import { fakeApi } from './support/fakeApi';

const signedIn = { user: { pseudo: 'alice', email: 'alice@example.com' } };

const match = {
  content: 'La procédure impose de prévenir le support sous deux heures.',
  name: 'procedure-incidents.md',
  score: 0.87,
};

test.describe('Recherche documentaire', () => {
  test('ne cherche pas avant trois caractères', async ({ page }) => {
    await fakeApi(page, { ...signedIn, knowledgeMatches: [match] });
    await page.goto('/settings');

    await page.getByLabel('Chercher dans la base de connaissances').fill('in');

    await expect(page.getByText(match.content)).toBeHidden();
  });

  test('montre le passage trouvé, son document et sa pertinence', async ({ page }) => {
    await fakeApi(page, { ...signedIn, knowledgeMatches: [match] });
    await page.goto('/settings');

    await page.getByLabel('Chercher dans la base de connaissances').fill('incident');

    await expect(page.getByText(match.content)).toBeVisible();
    await expect(page.getByText(match.name).first()).toBeVisible();
    await expect(page.getByText('87 %')).toBeVisible();
  });

  test('le dit quand rien ne correspond', async ({ page }) => {
    await fakeApi(page, { ...signedIn, knowledgeMatches: [] });
    await page.goto('/settings');

    await page.getByLabel('Chercher dans la base de connaissances').fill('introuvable');

    await expect(page.getByText(/Aucun passage ne correspond/)).toBeVisible();
  });
});
