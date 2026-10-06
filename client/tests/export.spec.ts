import { test, expect } from '@playwright/test';
import { conversation, fakeApi } from './support/fakeApi';

const signedIn = { user: { pseudo: 'alice', email: 'alice@example.com' } };

test('la conversation peut être téléchargée en Markdown', async ({ page }) => {
  const existing = conversation('conv-export', 'Les closures');
  await fakeApi(page, { ...signedIn, conversations: [existing] });
  await page.goto(`/chat/${existing.id}`);

  const bouton = page.getByRole('link', { name: 'Télécharger la conversation en Markdown' });

  await expect(bouton).toBeVisible();
  await expect(bouton).toHaveAttribute('href', new RegExp(`/conversations/${existing.id}/export$`));
});
