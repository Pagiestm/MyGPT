import { mailConfigured, parseSender } from './mail.service';

describe('parseSender', () => {
  it('sépare le nom et l’adresse', () => {
    expect(parseSender('MyGPT <no-reply@exemple.fr>')).toEqual({
      name: 'MyGPT',
      email: 'no-reply@exemple.fr',
    });
    expect(parseSender('"Équipe MyGPT" <contact@exemple.fr>')).toEqual({
      name: 'Équipe MyGPT',
      email: 'contact@exemple.fr',
    });
  });

  it('accepte une adresse nue', () => {
    expect(parseSender('  no-reply@exemple.fr ')).toEqual({ email: 'no-reply@exemple.fr' });
  });
});

describe('mailConfigured', () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it('exige un expéditeur et un transport', () => {
    delete process.env.MAIL_FROM;
    delete process.env.BREVO_API_KEY;
    delete process.env.SMTP_HOST;
    expect(mailConfigured()).toBe(false);

    process.env.MAIL_FROM = 'MyGPT <no-reply@exemple.fr>';
    expect(mailConfigured()).toBe(false);

    process.env.BREVO_API_KEY = 'cle';
    expect(mailConfigured()).toBe(true);

    delete process.env.BREVO_API_KEY;
    process.env.SMTP_HOST = 'mailpit';
    expect(mailConfigured()).toBe(true);
  });
});
