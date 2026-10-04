import { expect, test } from '@playwright/test';
import { conversation, fakeApi, message } from './support/fakeApi';

const signedIn = { user: { pseudo: 'alice', email: 'alice@example.com' } };

test.describe('Conversations', () => {
  test('démarre une conversation depuis une première question', async ({ page }) => {
    await fakeApi(page, { ...signedIn, aiReply: 'Bonjour, je suis **MyGPT**.' });
    await page.goto('/chat');

    await page.getByPlaceholder('Écrivez votre message...').fill('Présente-toi en une phrase');
    await page.getByRole('button', { name: 'Envoyer le message' }).click();

    await expect(page).toHaveURL(/\/chat\/conv-\d+$/);
    await expect(page.getByRole('heading', { name: 'Présente-toi en une phrase' })).toBeVisible();
    await expect(page.getByText('Bonjour, je suis')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Présente-toi en une phrase' })).toBeVisible();
  });

  test('renomme une conversation', async ({ page }) => {
    await fakeApi(page, { ...signedIn, conversations: [conversation('c1', 'Conversation test')] });
    await page.goto('/chat/c1');

    await page.getByRole('button', { name: 'Renommer la conversation' }).click();
    const name = page.getByRole('textbox', { name: 'Nom de la conversation' });
    await name.fill('Titre modifié');
    await name.press('Enter');

    await expect(page.getByRole('heading', { name: 'Titre modifié' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Titre modifié' })).toBeVisible();
  });

  test('renomme une conversation depuis la barre latérale', async ({ page }) => {
    await fakeApi(page, { ...signedIn, conversations: [conversation('c1', 'Ancien nom')] });
    await page.goto('/chat');

    await page.getByRole('button', { name: 'Actions pour Ancien nom' }).click();
    await page.getByRole('menuitem', { name: 'Renommer' }).click();
    const input = page.getByRole('textbox', { name: 'Nouveau nom' });
    await input.fill('Nouveau nom de conversation');
    await input.press('Enter');

    await expect(page.getByRole('link', { name: 'Nouveau nom de conversation' })).toBeVisible();
  });

  test('supprime une conversation après confirmation', async ({ page }) => {
    await fakeApi(page, {
      ...signedIn,
      conversations: [conversation('c1', 'À garder'), conversation('c2', 'À supprimer')],
    });
    await page.goto('/chat');

    await page.getByRole('button', { name: 'Actions pour À supprimer' }).click();
    await page.getByRole('menuitem', { name: 'Supprimer' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Supprimer' }).click();

    await expect(page.getByRole('link', { name: 'À supprimer' })).toBeHidden();
    await expect(page.getByRole('link', { name: 'À garder' })).toBeVisible();
  });

  test('filtre les conversations par recherche', async ({ page }) => {
    await fakeApi(page, {
      ...signedIn,
      conversations: [conversation('c1', 'Recettes de cuisine'), conversation('c2', 'Docker')],
    });
    await page.goto('/chat');

    await page.getByPlaceholder('Rechercher une conversation').fill('docker');

    await expect(page.getByRole('link', { name: 'Docker' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Recettes de cuisine' })).toBeHidden();
  });

  test('renvoie vers /chat si la conversation est introuvable', async ({ page }) => {
    await fakeApi(page, signedIn);
    await page.goto('/chat/inconnue');

    await expect(page.getByText('Conversation introuvable').first()).toBeVisible();
    await expect(page).toHaveURL(/\/chat$/);
  });
});

test.describe('Messages', () => {
  const withThread = (extra = {}) => ({
    ...signedIn,
    conversations: [conversation('c1', 'Conversation test')],
    messages: {
      c1: [message('c1', 'Message à modifier'), message('c1', 'Ancienne réponse', true)],
    },
    ...extra,
  });

  test('envoie un message et affiche la réponse', async ({ page }) => {
    await fakeApi(page, withThread({ aiReply: 'Voici la nouvelle réponse' }));
    await page.goto('/chat/c1');

    // Saisie touche par touche : sous Firefox, fill() émet une fin de composition IME
    // pendant laquelle Nuxt UI ignore volontairement la touche Entrée
    await page.getByPlaceholder('Écrivez votre message...').pressSequentially('Une autre question');
    await page.keyboard.press('Enter');

    await expect(page.getByText('Une autre question')).toBeVisible();
    await expect(page.getByText('Voici la nouvelle réponse')).toBeVisible();
  });

  test('modifie une question et régénère la suite', async ({ page }) => {
    await fakeApi(page, withThread({ aiReply: 'Réponse régénérée' }));
    await page.goto('/chat/c1');

    await page.getByText('Message à modifier').hover();
    await page.getByRole('button', { name: 'Modifier ce message' }).click();
    await page.getByPlaceholder('Modifiez votre message...').fill('Question corrigée');
    await page.getByRole('button', { name: 'Envoyer', exact: true }).click();

    await expect(page.getByText('Question corrigée')).toBeVisible();
    await expect(page.getByText('Réponse régénérée')).toBeVisible();
    await expect(page.getByText('Ancienne réponse')).toBeHidden();
  });

  test('annule une modification', async ({ page }) => {
    await fakeApi(page, withThread());
    await page.goto('/chat/c1');

    await page.getByText('Message à modifier').hover();
    await page.getByRole('button', { name: 'Modifier ce message' }).click();
    await page.getByPlaceholder('Modifiez votre message...').fill('Brouillon abandonné');
    await page.getByRole('button', { name: 'Annuler' }).click();

    await expect(page.getByText('Message à modifier')).toBeVisible();
    await expect(page.getByText('Brouillon abandonné')).toBeHidden();
  });

  test('recherche un message dans la conversation', async ({ page }) => {
    await fakeApi(page, withThread());
    await page.goto('/chat/c1');

    await page.getByRole('button', { name: 'Rechercher dans la conversation' }).click();
    await page.getByPlaceholder('Rechercher dans la conversation...').fill('ancienne');

    await expect(page.getByRole('dialog').getByText('Ancienne réponse')).toBeVisible();
  });

  test('rend le Markdown des réponses (gras, code en ligne)', async ({ page }) => {
    await fakeApi(page, {
      ...signedIn,
      conversations: [conversation('c1', 'Formatage')],
      messages: { c1: [message('c1', 'Du **texte en gras** et du `code inline`.', true)] },
    });
    await page.goto('/chat/c1');

    await expect(page.locator('strong', { hasText: 'texte en gras' })).toBeVisible();
    await expect(page.locator('code', { hasText: 'code inline' })).toBeVisible();
  });

  test('affiche les blocs de code à leur place, avec le langage', async ({ page }) => {
    await fakeApi(page, {
      ...signedIn,
      conversations: [conversation('c1', 'Code')],
      messages: {
        c1: [
          message(
            'c1',
            'Avant le code.\n\n```javascript\nfunction hello() {\n  return 42;\n}\n```\n\nAprès le code.',
            true,
          ),
        ],
      },
    });
    await page.goto('/chat/c1');

    const block = page.locator('figure', { hasText: 'javascript' });
    await expect(block).toContainText('function hello() {');
    await expect(block.getByRole('button', { name: 'Copier le code' })).toBeVisible();

    const order = await page.evaluate(() => {
      const text = document.body.innerText;
      return [
        text.indexOf('Avant le code'),
        text.indexOf('function hello'),
        text.indexOf('Après le code'),
      ];
    });
    expect(order[0]).toBeLessThan(order[1]);
    expect(order[1]).toBeLessThan(order[2]);
  });
});

test.describe("Effet d'écriture", () => {
  const longReply = `Début de la réponse. ${'Une phrase de remplissage pour allonger le texte. '.repeat(14)}Fin de la réponse.`;

  test('la nouvelle réponse apparaît progressivement', async ({ page }) => {
    await fakeApi(page, {
      ...signedIn,
      conversations: [conversation('c1', 'Écriture')],
      aiReply: longReply,
    });
    await page.goto('/chat/c1');

    await page.getByPlaceholder('Écrivez votre message...').pressSequentially('Raconte');
    await page.keyboard.press('Enter');

    await expect(page.getByText('Début de la réponse.')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Fin de la réponse.')).toBeHidden();
    await expect(page.getByText('Fin de la réponse.')).toBeVisible({ timeout: 15000 });
  });

  test("s'affiche d'un coup si l'utilisateur réduit les animations", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await fakeApi(page, {
      ...signedIn,
      conversations: [conversation('c1', 'Écriture')],
      aiReply: longReply,
    });
    await page.goto('/chat/c1');

    await page.getByPlaceholder('Écrivez votre message...').pressSequentially('Raconte');
    await page.keyboard.press('Enter');

    await expect(page.getByText('Fin de la réponse.')).toBeVisible({ timeout: 1500 });
  });

  test("l'historique n'est pas réanimé à l'ouverture", async ({ page }) => {
    await fakeApi(page, {
      ...signedIn,
      conversations: [conversation('c1', 'Écriture')],
      messages: { c1: [message('c1', 'Question'), message('c1', longReply, true)] },
    });
    await page.goto('/chat/c1');

    await expect(page.getByText('Fin de la réponse.')).toBeVisible({ timeout: 1500 });
  });
});

test.describe('Retours visuels', () => {
  test('confirme la copie d’une réponse', async ({ page, browserName, context }) => {
    test.skip(browserName !== 'chromium', 'Permissions presse-papiers disponibles sous Chromium');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await fakeApi(page, {
      ...signedIn,
      conversations: [conversation('c1', 'Copie')],
      messages: { c1: [message('c1', 'Question'), message('c1', 'Réponse à copier', true)] },
    });
    await page.goto('/chat/c1');

    await page.getByText('Réponse à copier').hover();
    await page.getByRole('button', { name: 'Copier la réponse' }).click();

    await expect(page.getByText('Réponse copiée').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Réponse copiée' })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('Réponse à copier');
  });

  test('referme le menu mobile même vers la page déjà affichée', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await fakeApi(page, { ...signedIn, conversations: [conversation('c1', 'Conversation test')] });
    await page.goto('/chat/c1');

    await page.getByRole('button', { name: 'Ouvrir la barre latérale' }).click();
    const menu = page.getByRole('dialog');
    await expect(menu).toBeVisible();
    await menu.getByRole('link', { name: 'Conversation test' }).click();

    await expect(menu).toBeHidden();
    await expect(page).toHaveURL(/\/chat\/c1$/);
  });
});
