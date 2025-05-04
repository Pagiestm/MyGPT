import { Page, expect } from '@playwright/test';

/**
 * Configure les mocks pour l'authentification
 */
export async function setupAuthentication(page: Page) {
    await page.route('**/auth/login', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                message: 'Connexion réussie',
                user: {
                    id: 'test-id',
                    pseudo: 'testuser',
                    email: 'test@example.com'
                }
            })
        });
    });

    await page.route('**/auth/check-session', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                valid: true,
                user: {
                    id: 'test-id',
                    pseudo: 'testuser',
                    email: 'test@example.com'
                }
            })
        });
    });
}

/**
 * Configure les mocks pour les conversations
 */
export async function setupConversations(
    page: Page,
    conversations: {
        id: string;
        name: string;
        userId: string;
        createdAt: string;
        updatedAt: string;
    }[] = []
) {
    // Si aucune conversation n'est fournie, utiliser une conversation par défaut
    if (conversations.length === 0) {
        conversations = [
            {
                id: 'test-conv-123',
                name: 'Conversation test',
                userId: 'test-id',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
    }

    await page.route('**/conversations', async (route) => {
        if (route.request().method() !== 'POST') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(conversations)
            });
        }
    });
}

/**
 * Configure le mock pour une conversation spécifique
 */
export async function setupSingleConversation(
    page: Page,
    conversationId: string,
    name: string
) {
    await page.route(`**/conversations/${conversationId}`, async (route) => {
        if (route.request().method() === 'GET') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: conversationId,
                    name: name,
                    userId: 'test-id',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    messages: []
                })
            });
        } else if (route.request().method() === 'PATCH') {
            const data = JSON.parse(route.request().postData() || '{}');

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: conversationId,
                    name: data.name || name,
                    userId: 'test-id',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    messages: []
                })
            });
        }
    });

    await page.route(
        `**/messages?conversationId=${conversationId}`,
        async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
        }
    );
}

/**
 * Configure le mock pour la suppression d'une conversation
 */
export async function setupConversationDeletion(
    page: Page,
    conversationId: string
) {
    await page.route(`**/conversations/${conversationId}`, async (route) => {
        if (route.request().method() === 'DELETE') {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({ message: 'Conversation supprimée' })
            });
        }
    });
}

/**
 * Configure les mocks pour les messages d'une conversation
 */
export async function setupMessages(
    page: Page,
    conversationId: string,
    messages: {
        id: string;
        content: string;
        conversationId: string;
        isFromAi: boolean;
        createdAt: string;
        updatedAt: string;
    }[] = []
) {
    // Si aucun message n'est fourni, utiliser des messages par défaut
    if (messages.length === 0) {
        messages = [
            {
                id: 'msg-1',
                content: 'Message utilisateur',
                conversationId,
                isFromAi: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'msg-2',
                content: 'Réponse IA',
                conversationId,
                isFromAi: true,
                createdAt: new Date(Date.now() + 1000).toISOString(),
                updatedAt: new Date(Date.now() + 1000).toISOString()
            }
        ];
    }

    await page.route(
        `**/messages?conversationId=${conversationId}`,
        async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(messages)
            });
        }
    );
}

/**
 * Configure le mock pour la création d'un message
 */
export async function setupMessageCreation(
    page: Page,
    message: {
        id: string;
        content: string;
        conversationId: string;
        isFromAi: boolean;
    }
) {
    await page.route('**/messages', async (route) => {
        if (route.request().method() === 'POST') {
            const postData = JSON.parse(route.request().postData() || '{}');
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: message.id || `msg-${Date.now()}`,
                    content: postData.content || message.content,
                    conversationId:
                        postData.conversationId || message.conversationId,
                    isFromAi: postData.isFromAi || message.isFromAi,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                })
            });
        }
    });
}

/**
 * Se connecte à l'application
 */
export async function login(page: Page) {
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Mot de passe').fill('Password123!');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page).toHaveURL(/.*\/chat/);
}
