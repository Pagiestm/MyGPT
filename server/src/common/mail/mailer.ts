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
