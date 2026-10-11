import { Injectable, Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import type { Mail, Mailer } from './mailer';

const TIMEOUT_MS = 10_000;

export function smtpConfigured(): boolean {
  return !!process.env.SMTP_HOST && !!process.env.MAIL_FROM;
}

@Injectable()
export class SmtpMailer implements Mailer {
  private readonly logger = new Logger(SmtpMailer.name);
  private transporter: Transporter | null = null;

  get available(): boolean {
    return smtpConfigured();
  }

  async send(mail: Mail): Promise<void> {
    if (!this.available) {
      this.logger.warn(`Courriel non envoyé, SMTP non configuré : ${mail.subject}`);
      return;
    }

    this.transporter ??= createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
      connectionTimeout: TIMEOUT_MS,
      greetingTimeout: TIMEOUT_MS,
      socketTimeout: TIMEOUT_MS * 2,
    });

    await this.transporter.sendMail({ from: process.env.MAIL_FROM, ...mail });
  }
}
