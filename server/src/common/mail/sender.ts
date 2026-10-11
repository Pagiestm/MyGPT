export interface Sender {
  name?: string;
  email: string;
}

export function parseSender(from: string): Sender {
  const match = from.trim().match(/^(.*?)\s*<([^>]+)>$/);
  if (!match) return { email: from.trim() };
  const name = match[1].replace(/^"|"$/g, '').trim();
  return name ? { name, email: match[2].trim() } : { email: match[2].trim() };
}
