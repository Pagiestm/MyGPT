import { BrevoMailer, brevoConfigured } from './brevo.mailer';
import { SmtpMailer, smtpConfigured } from './smtp.mailer';

export const MAILER = Symbol('Mailer');

export interface Mail {
  to: string;
  subject: string;
  html: string;
}

export interface Mailer {
  readonly available: boolean;
  send(mail: Mail): Promise<void>;
}

export function mailConfigured(): boolean {
  return brevoConfigured() || smtpConfigured();
}

export function createMailer(): Mailer {
  return brevoConfigured() ? new BrevoMailer() : new SmtpMailer();
}
