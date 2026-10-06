import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerException, ThrottlerGuard, type ThrottlerLimitDetail } from '@nestjs/throttler';
import type { Response } from 'express';

const AUTH_TTL_MS = 300_000;

export function waitMessage(seconds: number, strict: boolean): string {
  const wait = Math.max(1, Math.ceil(seconds));
  const minutes = Math.ceil(wait / 60);
  const delay =
    wait < 60
      ? `${wait} seconde${wait > 1 ? 's' : ''}`
      : `${minutes} minute${minutes > 1 ? 's' : ''}`;

  return strict
    ? `Trop de tentatives. Pour protéger votre compte, réessayez dans ${delay}.`
    : `Vous allez trop vite. Patientez ${delay} avant de réessayer.`;
}

@Injectable()
export class ThrottleGuard extends ThrottlerGuard {
  protected throwThrottlingException(
    context: ExecutionContext,
    detail: ThrottlerLimitDetail,
  ): Promise<void> {
    const seconds = detail.timeToBlockExpire || detail.timeToExpire || 1;
    context
      .switchToHttp()
      .getResponse<Response>()
      .setHeader('Retry-After', Math.max(1, Math.ceil(seconds)));

    return Promise.reject(new ThrottlerException(waitMessage(seconds, detail.ttl >= AUTH_TTL_MS)));
  }
}
