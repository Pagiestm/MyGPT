import { DomainError } from '../../common/domain/domain-error';
import { User } from './user';
import { UserRole } from './user-role.enum';

const account = () =>
  User.create({ email: 'alice@example.com', pseudo: 'alice42', passwordHash: 'hashed' });

describe('User', () => {
  it('starts as a plain user, never an administrator', () => {
    expect(account().role).toBe(UserRole.User);
    expect(account().isAdmin).toBe(false);
  });

  it('trims the pseudo so two accounts cannot differ by a space', () => {
    const user = account();

    user.rename('  bob  ');

    expect(user.pseudo).toBe('bob');
  });

  it('refuses a pseudo made only of spaces', () => {
    expect(() => account().rename('   ')).toThrow(DomainError);
  });

  it('treats blank instructions as no instructions', () => {
    const user = account();

    user.guideWith('   ');

    expect(user.customInstructions).toBeNull();
  });

  it('keeps trimmed instructions', () => {
    const user = account();

    user.guideWith('  Sois concis  ');

    expect(user.customInstructions).toBe('Sois concis');
  });

  it('lets the preferred model be cleared', () => {
    const user = account();

    user.prefer('webgpu:Qwen3.5-2B-q4f16_1-MLC');
    user.prefer(null);

    expect(user.preferredModel).toBeNull();
  });

  it('knows when a role change costs someone their admin rights', () => {
    const user = account();
    user.assign(UserRole.Admin);

    expect(user.losesAdminRights(UserRole.User)).toBe(true);
    expect(user.losesAdminRights(UserRole.Admin)).toBe(false);
  });

  it('does not consider a plain user as losing admin rights', () => {
    expect(account().losesAdminRights(UserRole.User)).toBe(false);
  });

  describe('comptes Google', () => {
    it('un compte créé par Google n’a pas de mot de passe', () => {
      const user = User.create({ email: 'a@b.fr', pseudo: 'alice', googleId: 'g-1' });

      expect(user.passwordHash).toBeNull();
      expect(user.signsInWithPassword).toBe(false);
    });

    it('lier Google ne retire pas le mot de passe existant', () => {
      const user = account();

      user.linkGoogle('g-1');

      expect(user.googleId).toBe('g-1');
      expect(user.signsInWithPassword).toBe(true);
    });

    describe('pseudoFrom', () => {
      it('retire les accents et remplace ce qui n’est pas autorisé', () => {
        expect(User.pseudoFrom('Théotime Pagiès')).toBe('Theotime_Pagies');
      });

      it('tronque à la longueur maximale', () => {
        expect(User.pseudoFrom('a'.repeat(40))).toHaveLength(20);
      });

      it('complète un nom trop court pour être un pseudo', () => {
        expect(User.pseudoFrom('Jo').length).toBeGreaterThanOrEqual(3);
      });

      it('ne laisse pas de séparateur en bordure', () => {
        expect(User.pseudoFrom('  !Alice!  ')).toBe('Alice');
      });
    });
  });
});
