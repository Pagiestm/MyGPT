import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SessionSerializer, type SessionUser } from './session.serializer';
import { UserOrm } from '../../../user/infrastructure/persistence/user.orm-entity';
import { UserRole } from '../../../user/domain/user-role.enum';

const account = { id: 'u1', email: 'a@b.c', pseudo: 'alice', role: UserRole.User };

describe('SessionSerializer', () => {
  let serializer: SessionSerializer;
  const users = { findOne: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    users.findOne.mockResolvedValue(account);

    const module = await Test.createTestingModule({
      providers: [SessionSerializer, { provide: getRepositoryToken(UserOrm), useValue: users }],
    }).compile();
    serializer = module.get(SessionSerializer);
  });

  const deserialize = (payload: { id: string }) =>
    new Promise<{ error: Error | null; user: SessionUser | null }>((resolve) =>
      serializer.deserializeUser(payload, (error, user) => resolve({ error, user })),
    );

  it('stores only the identifier in the session', () => {
    const done = jest.fn();
    serializer.serializeUser({ id: 'u1' }, done);

    expect(done).toHaveBeenCalledWith(null, { id: 'u1' });
  });

  it('rejects a user without an identifier', () => {
    const done = jest.fn();
    serializer.serializeUser({}, done);

    expect(done).toHaveBeenCalledWith(expect.any(Error), null);
  });

  it('reloads the account on every request, so a role change takes effect at once', async () => {
    users.findOne.mockResolvedValue({ ...account, role: UserRole.Admin });

    const { user } = await deserialize({ id: 'u1' });

    expect(user?.role).toBe(UserRole.Admin);
    expect(users.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'u1' } }));
  });

  it('invalidates the session of a deleted account', async () => {
    users.findOne.mockResolvedValue(null);

    expect((await deserialize({ id: 'u1' })).user).toBeNull();
  });

  it('never loads the password hash into the session', async () => {
    await deserialize({ id: 'u1' });
    const query = users.findOne.mock.calls.at(-1)![0] as { select: Record<string, boolean> };

    expect(query.select).not.toHaveProperty('password');
  });

  it('reports a database failure instead of a silent anonymous session', async () => {
    users.findOne.mockRejectedValue(new Error('base indisponible'));

    expect((await deserialize({ id: 'u1' })).error).toBeInstanceOf(Error);
  });
});
