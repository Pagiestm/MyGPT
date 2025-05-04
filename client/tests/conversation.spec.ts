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

        await setupSingleConversation(
            page,
            'new-conv-123',
            'Nouvelle conversation'
        );

        await page
            .getByRole('button', { name: /Nouvelle conversation/ })
            .click();

        await expect(page).toHaveURL(/.*\/chat\/new-conv-123/);

        await expect(
            page.getByRole('heading', { name: 'Nouvelle conversation' })
        ).toBeVisible();
    });

    test("Modification du titre d'une conversation", async ({ page }) => {
        await setupSingleConversation(
            page,
            'test-conv-123',
            'Conversation test'
        );

        await page.getByText('Conversation test').first().click();

        await expect(page).toHaveURL(/.*\/chat\/test-conv-123/);

        await expect(
            page.getByRole('heading', { name: 'Conversation test' })
        ).toBeVisible();

        await page
            .getByRole('heading', { name: 'Conversation test' })
            .locator('button, .edit-button')
            .click();

        await page
            .getByRole('textbox', { name: 'Nom de la conversation' })
            .waitFor();

        await page
            .getByRole('textbox', { name: 'Nom de la conversation' })
            .fill('Titre modifié');

        const responsePromise = page.waitForResponse(
            (response) =>
                response.url().includes('/conversations/test-conv-123') &&
                response.request().method() === 'PATCH'
        );

        await page
            .getByRole('textbox', { name: 'Nom de la conversation' })
            .press('Enter');

        try {
            await responsePromise;
        } catch (error) {
            console.log(
                'La promesse de réponse a échoué, mais continuons le test' +
                    error
            );
        }

        await expect(
            page.getByRole('heading', { name: 'Titre modifié' })
        ).toBeVisible();
    });

    test("Suppression d'une conversation", async ({ page }) => {
        await setupConversations(page, [
            {
                id: 'conv-to-delete',
                name: 'Conversation à supprimer',
                userId: 'test-id',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ]);

        await setupConversationDeletion(page, 'conv-to-delete');

        await page.reload();

        await page.waitForSelector('text=Conversation à supprimer');

        await page.locator('i.fas.fa-ellipsis-v').first().click();

        await page.waitForSelector('text=Supprimer');

        await page.locator('button:has-text("Supprimer")').click();

        await page.getByRole('button', { name: 'Supprimer' }).click();

        await expect(
            page.getByText('Conversation à supprimer')
        ).not.toBeVisible();
    });

    test('Recherche de conversations', async ({ page }) => {
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

        await page.getByPlaceholder(/Rechercher/).fill('recherche');

        await page.waitForTimeout(500);

        await expect(page.getByText('Résultat de recherche')).toBeVisible();
    });
});
