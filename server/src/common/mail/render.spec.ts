import { renderMail } from './render';

describe('renderMail', () => {
  it('compile le gabarit MJML en HTML pour messagerie', async () => {
    const html = await renderMail('password-reset', { pseudo: 'alice', link: 'https://x.fr/a' });

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('<table');
  });

  it('remplace les variables du gabarit', async () => {
    const html = await renderMail('password-reset', {
      pseudo: 'Théotime',
      link: 'https://mygpt.fr/reinitialiser/abc123',
    });

    expect(html).toContain('Théotime');
    expect(html).toContain('https://mygpt.fr/reinitialiser/abc123');
  });

  it('ne laisse aucune variable non remplacée', async () => {
    const html = await renderMail('password-reset', { pseudo: 'alice', link: 'https://x.fr/a' });

    expect(html).not.toMatch(/\{\{\s*\w+\s*\}\}/);
  });

  it('résiste à un gabarit reformaté, espaces compris', async () => {
    const html = await renderMail('password-reset', { pseudo: 'Alice', link: 'https://x.fr/a' });

    expect(html).toContain('Alice');
    expect(html).toContain('https://x.fr/a');
  });

  it('signale un gabarit introuvable plutôt que d’envoyer un courriel vide', async () => {
    await expect(renderMail('inexistant', {})).rejects.toThrow();
  });
});
