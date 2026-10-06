import type { ExecutionContext } from '@nestjs/common';
import { openSession } from './open-session';

const context = (logIn: unknown) =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user: { id: 'u1' }, logIn }) }),
  }) as unknown as ExecutionContext;

describe('openSession', () => {
  it('hands the authenticated user to passport so a session is written', async () => {
    const logIn = jest.fn((_user: unknown, done: (err?: Error) => void) => done());

    await openSession(context(logIn));

    expect(logIn).toHaveBeenCalledWith({ id: 'u1' }, expect.any(Function));
  });

  it('surfaces the failure instead of redirecting a visitor who is not logged in', async () => {
    const logIn = jest.fn((_user: unknown, done: (err?: Error) => void) =>
      done(new Error('session store indisponible')),
    );

    await expect(openSession(context(logIn))).rejects.toThrow('session store indisponible');
  });
});
