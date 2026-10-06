import { readFileSync } from 'fs';
import { join } from 'path';
import mjml2html from 'mjml';

const cache = new Map<string, string>();

function template(name: string): string {
  const cached = cache.get(name);
  if (cached) return cached;

  const source = readFileSync(join(__dirname, `${name}.mjml`), 'utf8');
  cache.set(name, source);
  return source;
}

function fill(source: string, values: Record<string, string>): string {
  return source.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => values[key] ?? '');
}

export async function renderMail(name: string, values: Record<string, string>): Promise<string> {
  const { html, errors } = await mjml2html(fill(template(name), values), {
    validationLevel: 'strict',
  });
  if (errors.length) {
    throw new Error(`Gabarit ${name} invalide : ${errors.map((e) => e.message).join(', ')}`);
  }
  return html;
}
