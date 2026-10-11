import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import type { Mail, Mailer } from './mailer';
import { parseSender } from './sender';

const API = 'https://api.brevo.com/v3';
const TIMEOUT_MS = 10_000;

export function brevoConfigured(): boolean {
  return !!process.env.BREVO_API_KEY && !!process.env.MAIL_FROM;
}

@Injectable()
export class BrevoMailer implements Mailer, OnModuleInit {
  private readonly logger = new Logger(BrevoMailer.name);

  get available(): boolean {
    return brevoConfigured();
  }

  onModuleInit(): void {
    if (!this.available) return;
    this.call('/account', 'GET').then(
      (response) =>
        response.ok
          ? this.logger.log('Courriels envoyés par l’API Brevo')
          : this.logger.warn(`Clé Brevo refusée (HTTP ${response.status})`),
      (error: unknown) =>
        this.logger.warn(
          `API Brevo injoignable : ${error instanceof Error ? error.message : 'erreur inconnue'}`,
        ),
    );
  }

  async send(mail: Mail): Promise<void> {
    if (!this.available) {
      this.logger.warn(`Courriel non envoyé, Brevo non configuré : ${mail.subject}`);
      return;
    }

    const response = await this.call('/smtp/email', 'POST', {
      sender: parseSender(process.env.MAIL_FROM ?? ''),
      to: [{ email: mail.to }],
      subject: mail.subject,
      htmlContent: mail.html,
    });
    if (!response.ok) {
      throw new Error(`Brevo HTTP ${response.status} : ${await response.text()}`);
    }
  }

  private call(path: string, method: 'GET' | 'POST', body?: unknown): Promise<Response> {
    return fetch(`${API}${path}`, {
      method,
      headers: {
        'api-key': process.env.BREVO_API_KEY ?? '',
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  }
}
