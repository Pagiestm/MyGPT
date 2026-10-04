import { expect, test } from '@playwright/test';
import { conversation, fakeApi, folder, message } from './support/fakeApi';

const signedIn = { user: { pseudo: 'alice', email: 'alice@example.com' } };

test.describe('Organisation', () => {
  test('épingle une conversation en haut de la liste', async ({ page }) => {
    await fakeApi(page, {
      ...signedIn,
      conversations: [conversation('c1', 'Liste de courses'), conversation('c2', 'Projet perso')],
    });
    await page.goto('/chat');

    await page.getByRole('button', { name: 'Actions pour Projet perso' }).click();
    await page.getByRole('menuitem', { name: 'Épingler' }).click();

    const pinned = page.getByRole('region', { name: 'Épinglées' });
    await expect(pinned.getByRole('link', { name: 'Projet perso' })).toBeVisible();
    await expect(pinned.getByRole('link', { name: 'Liste de courses' })).toBeHidden();
  });

  test('archive puis restaure une conversation', async ({ page }) => {
    await fakeApi(page, { ...signedIn, conversations: [conversation('c1', 'Vieux sujet')] });
    await page.goto('/chat');

    await page.getByRole('button', { name: 'Actions pour Vieux sujet' }).click();
    await page.getByRole('menuitem', { name: 'Archiver' }).click();
    await expect(page.getByRole('link', { name: 'Vieux sujet' })).toBeHidden();

    await page.getByRole('link', { name: 'Archives' }).click();
    await expect(page).toHaveURL(/\/archives$/);
    await page.getByRole('button', { name: 'Restaurer Vieux sujet' }).click();

    await expect(page.getByText('Aucune conversation archivée')).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: 'Conversations' }).getByRole('link', {
        name: 'Vieux sujet',
      }),
    ).toBeVisible();
  });

  test('crée un dossier et y range une conversation', async ({ page }) => {
    await fakeApi(page, { ...signedIn, conversations: [conversation('c1', 'Exercice de maths')] });
    await page.goto('/chat');

    await page.getByRole('button', { name: 'Nouveau dossier' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByPlaceholder('Cours de JavaScript').fill('Cours');
    await dialog.getByRole('button', { name: 'Créer' }).click();
    await expect(page.getByRole('button', { name: 'Dossier Cours', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Actions pour Exercice de maths' }).click();
    await page.getByRole('menuitem', { name: 'Déplacer vers' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Cours' }).click();

    const folders = page.getByRole('region', { name: 'Dossiers' });
    await expect(folders.getByRole('button', { name: 'Dossier Cours', exact: true })).toContainText(
      '1',
    );
    await folders.getByRole('button', { name: 'Dossier Cours', exact: true }).click();
    await expect(folders.getByRole('link', { name: 'Exercice de maths' })).toBeVisible();
  });

  test('démarre une conversation dans un dossier', async ({ page }) => {
    const api = await fakeApi(page, { ...signedIn, folders: [folder('f1', 'Travail')] });
    await page.goto('/chat');

    await page.getByRole('button', { name: 'Actions pour le dossier Travail' }).click();
    await page.getByRole('menuitem', { name: 'Nouvelle conversation ici' }).click();
    await page.getByPlaceholder('Écrivez votre message...').fill('Prépare la réunion');
    await page.getByRole('button', { name: 'Envoyer le message' }).click();

    await expect(page).toHaveURL(/\/chat\/conv-\d+$/);
    expect(api.conversations[0].folderId).toBe('f1');
  });

  test('ouvre la recherche globale avec Ctrl+K et va au message', async ({ page }) => {
    await fakeApi(page, {
      ...signedIn,
      conversations: [conversation('c1', 'Voyage'), conversation('c2', 'Autre')],
      messages: {
        c1: [message('c1', 'Que voir à Lisbonne ?'), message('c1', 'Le quartier de Belém', true)],
      },
    });
    await page.goto('/chat/c2');
    await expect(page.getByRole('heading', { name: 'Autre' })).toBeVisible();

    // L'interface attend ⌘ dès que le navigateur se présente comme un Mac (WebKit de Playwright)
    const mac = await page.evaluate(() => /Macintosh|Mac OS X/.test(navigator.userAgent));
    await page.keyboard.press(mac ? 'Meta+k' : 'Control+k');
    const palette = page.getByRole('dialog');
    await palette
      .getByPlaceholder('Rechercher une conversation, un message, une action…')
      .fill('belém');
    await palette.getByRole('option', { name: /Le quartier de Belém/ }).click();

    await expect(page).toHaveURL(/\/chat\/c1/);
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('article').getByText('Le quartier de Belém')).toBeVisible();
  });
});

test.describe('Personnalisation', () => {
  test('enregistre les consignes et le modèle par défaut', async ({ page }) => {
    const api = await fakeApi(page, signedIn);
    await page.goto('/settings');

    await page
      .getByRole('textbox', { name: 'Consignes personnalisées' })
      .fill('Réponds toujours en tutoyant.');
    await page.getByRole('combobox', { name: 'Modèle par défaut' }).click();
    await page.getByRole('option', { name: 'Pro' }).click();
    await page.getByRole('button', { name: 'Enregistrer' }).nth(1).click();

    await expect(
      page.getByText('Vos préférences ont été enregistrées', { exact: true }),
    ).toBeVisible();
    expect(api.user).toMatchObject({
      customInstructions: 'Réponds toujours en tutoyant.',
      preferredModel: 'pro',
    });
  });

  test('le modèle préféré est sélectionné par défaut dans le chat', async ({ page }) => {
    await fakeApi(page, { user: { ...signedIn.user, preferredModel: 'lite' } });
    await page.goto('/chat');

    await expect(page.getByRole('button', { name: "Modèle d'IA" })).toContainText('Flash Lite');
  });
});
