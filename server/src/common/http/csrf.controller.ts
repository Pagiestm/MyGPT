import { Controller, Get, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CSRF_COOKIE, LEGACY_CSRF_PATHS, generateCsrfToken } from './csrf';

declare module 'express-session' {
  interface SessionData {
    csrfIssuedAt?: number;
  }
}

@ApiTags('security')
@Controller('csrf')
export class CsrfController {
  @Get()
  @ApiOperation({ summary: 'Jeton anti-CSRF à renvoyer dans l’en-tête X-CSRF-Token' })
  token(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    for (const path of LEGACY_CSRF_PATHS) {
      if (req.cookies?.[CSRF_COOKIE] !== undefined) res.clearCookie(CSRF_COOKIE, { path });
    }
    req.session.csrfIssuedAt = Date.now();
    return { token: generateCsrfToken(req, res) };
  }
}
