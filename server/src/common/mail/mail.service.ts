import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import type { Mail, Mailer } from './mailer';

const BREVO_API = 'https://api.brevo.com/v3';
const TIMEOUT_MS = 10_000;

export function mailConfigured(): boolean {
  return !!process.env.MAIL_FROM && !!(process.env.BREVO_API_KEY || process.env.SMTP_HOST);
}

export function parseSender(from: string): { name?: string; email: string } {
  const match = from.trim().match(/^(.*?)\s*<([^>]+)>$/);
  if (!match) return { email: from.trim() };
  const name = match[1].replace(/^"|"$/g, '').trim();
  return name ? { name, email: match[2].trim() } : { email: match[2].trim() };
}

const describe = (error: unknown) => (error instanceof Error ? error.message : 'erreur inconnue');

@Injectable()
export class MailService implements Mailer, OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  get available(): boolean {
    return mailConfigured();
  }

  private get viaApi(): boolean {
    return !!process.env.BREVO_API_KEY;
  }

  onModuleInit(): void {
    if (!this.available) {
      this.logger.warn('Aucun envoi de courriel configuré');
      return;
    }
    const check = this.viaApi
      ? this.callApi('/account', 'GET').then((response) => {
          if (!response.ok) throw new Error(`clé refusée (HTTP ${response.status})`);
        })
      : this.smtp().verify();
    check.then(
      () => this.logger.log(`Courriels envoyés par ${this.viaApi ? "l'API Brevo" : 'SMTP'}`),
      (error: unknown) => this.logger.warn(`Envoi de courriels indisponible : ${describe(error)}`),
    );
  }

  async send(mail: Mail): Promise<void> {
    if (!this.available) {
      this.logger.warn(`Courriel non envoyé, envoi non configuré : ${mail.subject}`);
      return;
    }
    if (this.viaApi) {
      const response = await this.callApi('/smtp/email', 'POST', {
        sender: parseSender(process.env.MAIL_FROM ?? ''),
        to: [{ email: mail.to }],
        subject: mail.subject,
        htmlContent: mail.html,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} : ${await response.text()}`);
      return;
    }
    await this.smtp().sendMail({ from: process.env.MAIL_FROM, ...mail });
  }

  private smtp(): Transporter {
    this.transporter ??= createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
      connectionTimeout: TIMEOUT_MS,
      greetingTimeout: TIMEOUT_MS,
      socketTimeout: TIMEOUT_MS * 2,
    });
    return this.transporter;
  }

  private callApi(path: string, method: 'GET' | 'POST', body?: unknown): Promise<Response> {
    return fetch(`${BREVO_API}${path}`, {
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
