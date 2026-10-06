import { ArgumentsHost, BadRequestException, Catch, type ExceptionFilter } from '@nestjs/common';
import type { HttpAdapterHost } from '@nestjs/core';
import { DomainError } from './domain/domain-error';

@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(error: DomainError, host: ArgumentsHost): void {
    const { httpAdapter } = this.adapterHost;
    const translated = new BadRequestException(error.message);

    httpAdapter.reply(
      host.switchToHttp().getResponse(),
      translated.getResponse(),
      translated.getStatus(),
    );
  }
}
