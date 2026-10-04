import { expect, test } from '@playwright/test';
import { conversation, fakeApi, message } from './support/fakeApi';

test.describe('Partage', () => {
  test('crée un lien de partage', async ({ page }) => {
    await fakeApi(page, {
      user: { pseudo: 'alice', email: 'alice@example.com' },
      conversations: [conversation('c1', 'À partager')],
    });
    await page.goto('/chat/c1');

    await page.getByRole('button', { name: 'Partager la conversation' }).click();
    await page.getByRole('button', { name: 'Créer le lien' }).click();

    await expect(page.getByRole('textbox', { name: 'Lien de partage' })).toHaveValue(
      /\/s\/lien-public-123$/,
    );
  });

  test('ouvre une conversation partagée sans compte', async ({ page }) => {
    const shared = { ...conversation('c1', 'Conversation publique'), shareLink: 'abc' };
    await fakeApi(page, {
      conversations: [shared],
      messages: {
        c1: [message('c1', 'Question publique'), message('c1', 'Réponse publique', true)],
      },
    });
    await page.goto('/s/abc');

    await expect(page.getByRole('heading', { name: 'Conversation publique' })).toBeVisible();
    await expect(page.getByText('Partagée par alice')).toBeVisible();
    await expect(page.getByText('Réponse publique')).toBeVisible();
    await expect(page.getByRole('link', { name: "Se connecter pour l'enregistrer" })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Modifier ce message' })).toHaveCount(0);
  });

  test('signale un lien invalide', async ({ page }) => {
    await fakeApi(page);
    await page.goto('/s/inexistant');
    await expect(page.getByText("Ce lien de partage n'est plus valide")).toBeVisible();
  });

  test("redirige l'ancienne URL de partage", async ({ page }) => {
    await fakeApi(page);
    await page.goto('/chat/shared/abc');
    await expect(page).toHaveURL(/\/s\/abc$/);
  });
});
