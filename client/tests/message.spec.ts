import { test, expect } from '@playwright/test';
import {
    setupAuthentication,
    setupConversations,
    setupSingleConversation,
    setupMessages,
    login
} from './helpers/testHelpers';

test.describe('Fonctionnalités des messages', () => {
    test.setTimeout(60000);

    test.beforeEach(async ({ page }) => {
        await setupAuthentication(page);
        await setupConversations(page);
        await login(page);
        await setupSingleConversation(
            page,
            'test-conv-123',
            'Conversation test'
        );
    });

    test('Envoi de message dans une conversation vide', async ({ page }) => {
        await setupMessages(page, 'test-conv-123', []);

        await page.route('**/messages', async (route) => {
            if (route.request().method() === 'POST') {
                const postData = JSON.parse(route.request().postData() || '{}');
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        id: 'new-msg-123',
                        content: postData.content,
                        conversationId: 'test-conv-123',
                        isFromAi: false,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    })
                });
            }
        });

        await page.route(
            `**/messages?conversationId=test-conv-123`,
            async (route) => {
                if (route.request().method() === 'GET') {
                    const messages = [];
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify(messages)
                    });
                }
            }
        );

        await page.goto('/chat/test-conv-123');

        await expect(
            page.getByRole('heading', { name: 'Conversation test' })
        ).toBeVisible();

        await expect(
            page.locator('textarea[placeholder="Écrivez votre message..."]')
        ).toBeVisible();

        await page
            .locator('textarea[placeholder="Écrivez votre message..."]')
            .fill("Comment puis-je vous aider aujourd'hui ?");

        await page.locator('button[title="Envoyer le message"]').click();

        await page.waitForTimeout(1000);
    });

    test('Modification de message utilisateur', async ({ page }) => {
        await page.route(
            `**/messages?conversationId=test-conv-123`,
            async (route) => {
                if (route.request().method() === 'GET') {
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify([
                            {
                                id: 'msg-user-123',
                                content: 'Message initial',
                                conversationId: 'test-conv-123',
                                isFromAi: false,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                            },
                            {
                                id: 'msg-ai-123',
                                content: 'Réponse IA initiale',
                                conversationId: 'test-conv-123',
                                isFromAi: true,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                            }
                        ])
                    });
                }
            }
        );

        await page.route('**/messages/msg-user-123', async (route) => {
            if (route.request().method() === 'PATCH') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        id: 'msg-user-123',
                        content: 'Message modifié',
                        conversationId: 'test-conv-123',
                        isFromAi: false,
                        regenerateAi: true,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    })
                });
            }
        });

        await page.route('**/messages/regenerate', async (route) => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        id: 'new-ai-response-123',
                        content: 'Nouvelle réponse IA après modification',
                        conversationId: 'test-conv-123',
                        isFromAi: true,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    })
                });
            }
        });

        await page.goto('/chat/test-conv-123');

        await expect(
            page.getByRole('heading', { name: 'Conversation test' })
        ).toBeVisible();

        await page.locator('.group').first().hover();
        await page.locator('button[title="Modifier ce message"]').click();

        await expect(
            page.locator('textarea[placeholder="Modifiez votre message..."]')
        ).toBeVisible();

        await page
            .locator('textarea[placeholder="Modifiez votre message..."]')
            .fill('Message modifié');
        await page.getByRole('button', { name: 'Modifier' }).click();

        await page.waitForTimeout(3000);
    });

    test('Annulation de modification', async ({ page }) => {
        await setupMessages(page, 'test-conv-123', [
            {
                id: 'msg-user-123',
                content: 'Message à ne pas modifier',
                conversationId: 'test-conv-123',
                isFromAi: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ]);

        await page.goto('/chat/test-conv-123');
        await expect(page.getByText('Message à ne pas modifier')).toBeVisible();

        await page
            .locator('.group')
            .filter({ hasText: 'Message à ne pas modifier' })
            .hover();
        await page.locator('button[title="Modifier ce message"]').click();

        const editTextarea = page.locator(
            'textarea[placeholder="Modifiez votre message..."]'
        );
        await editTextarea.fill('Cette modification sera annulée');
        await page.getByRole('button', { name: 'Annuler' }).click();

        await expect(page.getByText('Message à ne pas modifier')).toBeVisible();
        await expect(
            page.getByText('Cette modification sera annulée')
        ).not.toBeVisible();
    });

    test('Recherche dans une conversation', async ({ page }) => {
        await setupMessages(page, 'test-conv-123', [
            {
                id: 'msg-user-1',
                content: 'Premier message contenant le terme recherche',
                conversationId: 'test-conv-123',
                isFromAi: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'msg-ai-1',
                content: 'Réponse sans le terme',
                conversationId: 'test-conv-123',
                isFromAi: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ]);

        await page.route(
            '**/messages/search?keyword=recherche&conversationId=test-conv-123',
            async (route) => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([
                        {
                            id: 'msg-user-1',
                            content:
                                'Premier message contenant le terme recherche',
                            conversationId: 'test-conv-123',
                            isFromAi: false,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        }
                    ])
                });
            }
        );

        await page.goto('/chat/test-conv-123');

        await expect(
            page.getByRole('heading', { name: 'Conversation test' })
        ).toBeVisible();

        await page.getByTitle('Rechercher dans la conversation').click();

        await expect(
            page.getByPlaceholder('Rechercher dans la conversation...')
        ).toBeVisible();

        await page
            .getByPlaceholder('Rechercher dans la conversation...')
            .fill('recherche');

        await page.keyboard.press('Enter');

        await page.waitForTimeout(3000);
    });

    test('Affichage du formatage (gras et code)', async ({ page }) => {
        await setupMessages(page, 'test-conv-123', [
            {
                id: 'formatted-msg-1',
                content: 'Voici du **texte en gras** et du `code inline`',
                conversationId: 'test-conv-123',
                isFromAi: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ]);

        await page.goto('/chat/test-conv-123');
        await expect(page.locator('strong')).toHaveText('texte en gras');
        await expect(page.locator('code')).toHaveText('code inline');
    });

    test('Affichage des blocs de code', async ({ page }) => {
        const codeBlock =
            "```javascript\nfunction hello() {\n  console.log('Hello world');\n}\n```";
        await setupMessages(page, 'test-conv-123', [
            {
                id: 'code-block-msg',
                content: `Voici un exemple de code:\n${codeBlock}`,
                conversationId: 'test-conv-123',
                isFromAi: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ]);

        await page.goto('/chat/test-conv-123');
        await expect(page.locator('.bg-gray-800')).toBeVisible();
        await expect(page.locator('.bg-gray-700')).toContainText('javascript');
        await expect(page.locator('code.block')).toContainText(
            'function hello() {'
        );
    });
});
