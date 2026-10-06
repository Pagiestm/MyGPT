import type { Conversation } from './conversation';
import type { TranscriptEntry } from './conversation-transcript';

const ISO_DAY = 10;

export function toMarkdown(conversation: Conversation, messages: TranscriptEntry[]): string {
  const header = [
    `# ${conversation.name}`,
    '',
    `Exportée le ${new Date().toISOString().slice(0, ISO_DAY)} depuis MyGPT.`,
    '',
  ];

  const body = messages.flatMap((message) => [
    `## ${message.isFromAi ? 'Assistant' : 'Vous'}`,
    '',
    message.content.trim(),
    '',
  ]);

  return [...header, ...body].join('\n').trimEnd() + '\n';
}

export function toFileName(conversation: Conversation): string {
  const slug = conversation.name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 60);

  return `${slug || 'conversation'}.md`;
}
