import { parseSender } from './sender';

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
