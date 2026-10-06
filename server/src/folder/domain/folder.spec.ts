import { DomainError } from '../../common/domain/domain-error';
import { Folder } from './folder';

describe('Folder', () => {
  describe('create', () => {
    it('retire les espaces autour du nom', () => {
      expect(Folder.create('u1', '  Cours de JS  ').name).toBe('Cours de JS');
    });

    it('refuse un nom vide, avec une erreur de domaine traduisible en 400', () => {
      expect(() => Folder.create('u1', '   ')).toThrow(DomainError);
      expect(() => Folder.create('u1', '   ')).toThrow('Le nom du dossier est requis');
    });

    it('normalise des consignes vides en absence de consignes', () => {
      expect(Folder.create('u1', 'Cours', '   ').instructions).toBeNull();
      expect(Folder.create('u1', 'Cours').instructions).toBeNull();
    });

    it('conserve des consignes réelles, sans espaces superflus', () => {
      expect(Folder.create('u1', 'Cours', '  Sois concis  ').instructions).toBe('Sois concis');
    });
  });

  describe('belongsTo', () => {
    it('reconnaît son propriétaire', () => {
      expect(Folder.create('u1', 'Cours').belongsTo('u1')).toBe(true);
    });

    it('rejette quiconque d’autre', () => {
      expect(Folder.create('u1', 'Cours').belongsTo('u2')).toBe(false);
    });
  });

  describe('rename', () => {
    it('applique les mêmes règles que la création', () => {
      const folder = Folder.create('u1', 'Cours');
      folder.rename('  Nouveau  ');

      expect(folder.name).toBe('Nouveau');
      expect(() => folder.rename('  ')).toThrow();
    });
  });

  describe('guideWith', () => {
    it('efface les consignes avec une chaîne vide ou null', () => {
      const folder = Folder.create('u1', 'Cours', 'Sois concis');

      folder.guideWith('  ');
      expect(folder.instructions).toBeNull();

      folder.guideWith('Explique bien');
      folder.guideWith(null);
      expect(folder.instructions).toBeNull();
    });
  });

  it('se reconstruit depuis un état persisté sans rejouer les règles', () => {
    const at = new Date('2026-01-01');
    const folder = Folder.rehydrate({
      id: 'f1',
      userId: 'u1',
      name: 'Déjà enregistré',
      instructions: null,
      createdAt: at,
      updatedAt: at,
    });

    expect(folder.id).toBe('f1');
    expect(folder.createdAt).toBe(at);
  });
});
