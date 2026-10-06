import { ExecutionContext, NotFoundException } from '@nestjs/common';
import { GoogleAuthGuard } from './google-auth.guard';

describe('GoogleAuthGuard', () => {
  const previous = { ...process.env };

  afterEach(() => {
    process.env = { ...previous };
  });

  it('answers 404 rather than crashing when the instance has no Google credentials', () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;

    expect(() => new GoogleAuthGuard().canActivate({} as ExecutionContext)).toThrow(
      NotFoundException,
    );
  });
});
