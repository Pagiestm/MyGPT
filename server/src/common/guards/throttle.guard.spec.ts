import { waitMessage } from './throttle.guard';

describe('waitMessage', () => {
  describe('en secondes', () => {
    it.each([
      [1, '1 seconde'],
      [2, '2 secondes'],
      [45, '45 secondes'],
    ])('annonce %i s', (seconds, expected) => {
      expect(waitMessage(seconds, false)).toContain(expected);
    });

    it('arrondit à la seconde supérieure', () => {
      expect(waitMessage(2.1, false)).toContain('3 secondes');
    });

    it('ne descend jamais sous une seconde', () => {
      expect(waitMessage(0, false)).toContain('1 seconde');
    });
  });

  describe('en minutes', () => {
    it.each([
      [60, '1 minute'],
      [120, '2 minutes'],
      [900, '15 minutes'],
    ])('annonce %i s en minutes', (seconds, expected) => {
      expect(waitMessage(seconds, true)).toContain(expected);
    });
  });

  describe('selon le contexte', () => {
    it('parle de protection du compte sur les routes sensibles', () => {
      expect(waitMessage(900, true)).toBe(
        'Trop de tentatives. Pour protéger votre compte, réessayez dans 15 minutes.',
      );
    });

    it('reste neutre ailleurs', () => {
      expect(waitMessage(3, false)).toBe(
        'Vous allez trop vite. Patientez 3 secondes avant de réessayer.',
      );
    });

    it('ne laisse jamais fuiter le nom de la classe technique', () => {
      expect(waitMessage(5, false)).not.toContain('Throttler');
      expect(waitMessage(5, true)).not.toContain('Throttler');
    });
  });
});
