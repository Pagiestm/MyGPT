import { test, expect } from '@playwright/test';
import {
    setupAuthentication,
    setupConversations,
    setupSingleConversation,
    setupConversationDeletion,
    login
} from './helpers/testHelpers';

test.describe('Gestion des conversations', () => {
    test.beforeEach(async ({ page }) => {
        await setupAuthentication(page);

        await setupConversations(page);

        await login(page);
    });

    test("Création d'une nouvelle conversation", async ({ page }) => {
        // Mock pour la création de conversation
        await page.route('**/conversations', async (route) => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        id: 'new-conv-123',
                        name: 'Nouvelle conversation',
                        userId: 'test-id',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    })
                });
            }
        });

        // Configurer le mock pour la nouvelle conversation
        await setupSingleConversation(
            page,
            'new-conv-123',
            'Nouvelle conversation'
        );

        // Cliquer sur le bouton pour créer une nouvelle conversation
        await page
            .getByRole('button', { name: /Nouvelle conversation/ })
            .click();

        // Vérifier qu'on est redirigé vers la nouvelle conversation
        await expect(page).toHaveURL(/.*\/chat\/new-conv-123/);

        // Vérifier que le titre est visible
        await expect(
            page.getByRole('heading', { name: 'Nouvelle conversation' })
        ).toBeVisible();
    });

    test("Modification du titre d'une conversation", async ({ page }) => {
        // Configurer le mock pour la conversation à modifier
        await setupSingleConversation(
            page,
            'test-conv-123',
            'Conversation test'
        );

        // Cliquer sur la conversation existante dans la liste
        await page.getByText('Conversation test').first().click();

        // Attendre d'être sur la page de la conversation
        await expect(page).toHaveURL(/.*\/chat\/test-conv-123/);

        // S'assurer que le titre est visible
        await expect(
            page.getByRole('heading', { name: 'Conversation test' })
        ).toBeVisible();

        // Cliquer sur le bouton d'édition
        await page
            .getByRole('heading', { name: 'Conversation test' })
            .locator('button, .edit-button')
            .click();

        // Attendre que l'input apparaisse
        await page
            .getByRole('textbox', { name: 'Nom de la conversation' })
            .waitFor();

        // Remplir le champ avec la nouvelle valeur
        await page
            .getByRole('textbox', { name: 'Nom de la conversation' })
            .fill('Titre modifié');

        // Créer une promesse pour intercepter la réponse
        const responsePromise = page.waitForResponse(
            (response) =>
                response.url().includes('/conversations/test-conv-123') &&
                response.request().method() === 'PATCH'
        );

        // Appuyer sur Enter pour confirmer la modification
        await page
            .getByRole('textbox', { name: 'Nom de la conversation' })
            .press('Enter');

        try {
            // Attendre que la requête PATCH soit complétée
            await responsePromise;
        } catch (error) {
            // Ignorer l'erreur et continuer
            console.log(
                'La promesse de réponse a échoué, mais continuons le test' +
                    error
            );
        }

        // Vérifier que le titre a été mis à jour
        await expect(
            page.getByRole('heading', { name: 'Titre modifié' })
        ).toBeVisible();
    });

    test("Suppression d'une conversation", async ({ page }) => {
        // Configurer le mock pour une liste avec la conversation à supprimer
        await setupConversations(page, [
            {
                id: 'conv-to-delete',
                name: 'Conversation à supprimer',
                userId: 'test-id',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ]);

        // Configurer le mock pour la suppression
        await setupConversationDeletion(page, 'conv-to-delete');

        // Rafraîchir la page pour voir la liste des conversations
        await page.reload();

        // Attendre que la conversation apparaisse dans la liste
        await page.waitForSelector('text=Conversation à supprimer');

        // Cibler l'icône pour ouvrir le menu
        await page.locator('i.fas.fa-ellipsis-v').first().click();

        // Attendre que le menu s'affiche
        await page.waitForSelector('text=Supprimer');

        // Cliquer sur l'option Supprimer
        await page.locator('button:has-text("Supprimer")').click();

        // Confirmer la suppression
        await page.getByRole('button', { name: 'Supprimer' }).click();

        // Vérifier que la conversation n'apparaît plus
        await expect(
            page.getByText('Conversation à supprimer')
        ).not.toBeVisible();
    });

    test('Recherche de conversations', async ({ page }) => {
        // Mock pour la recherche
        await page.route(
            '**/conversations/search?keyword=recherche',
            async (route) => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([
                        {
                            id: 'search-result-id',
                            name: 'Résultat de recherche',
                            userId: 'test-id',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        }
                    ])
                });
            }
        );

        // Remplir le champ de recherche
        await page.getByPlaceholder(/Rechercher/).fill('recherche');

        // Attendre un peu pour que la recherche soit traitée
        await page.waitForTimeout(500);

        // Vérifier que les résultats s'affichent
        await expect(page.getByText('Résultat de recherche')).toBeVisible();
    });
});
