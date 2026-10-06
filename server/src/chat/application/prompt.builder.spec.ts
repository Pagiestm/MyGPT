import { Message } from '../../message/domain/message';
import type { ExchangeContext } from './chat.use-cases';
import { describe as describeAttachments, toMessages } from './prompt.builder';

const question = (content: string) =>
  Message.rehydrate({
    id: 'm1',
    conversationId: 'c1',
    content,
    isFromAi: false,
    model: null,
    attachments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

const context = (overrides: Partial<ExchangeContext> = {}): ExchangeContext => ({
  question: question('Et en Python ?'),
  history: [],
  attachments: [],
  ...overrides,
});

describe('describe', () => {
  it('inlines a text file so the model can read it', () => {
    const [line] = describeAttachments([
      { name: 'notes.md', mimeType: 'text/plain', data: Buffer.from('Bonjour') },
    ]);

    expect(line).toContain('notes.md');
    expect(line).toContain('Bonjour');
  });

  it('says plainly that an image cannot be read in the browser', () => {
    const [line] = describeAttachments([
      { name: 'schema.png', mimeType: 'image/png', data: Buffer.from('binaire') },
    ]);

    expect(line).toContain('non lisible');
    expect(line).not.toContain('binaire');
  });

  it('treats a PDF the same way as an image', () => {
    const [line] = describeAttachments([
      { name: 'contrat.pdf', mimeType: 'application/pdf', data: Buffer.from('%PDF') },
    ]);

    expect(line).toContain('non lisible');
  });
});

describe('toMessages', () => {
  it('puts the instructions first, as a system turn', () => {
    const messages = toMessages(context({ systemInstruction: 'Sois concis' }));

    expect(messages[0]).toEqual({ role: 'system', content: 'Sois concis' });
  });

  it('omits the system turn when there is nothing to say', () => {
    expect(toMessages(context()).every((message) => message.role !== 'system')).toBe(true);
  });

  it('renames the model role the way the browser expects', () => {
    const messages = toMessages(
      context({
        history: [
          { role: 'user', text: 'Salut' },
          { role: 'model', text: 'Bonjour' },
        ],
      }),
    );

    expect(messages).toEqual([
      { role: 'user', content: 'Salut' },
      { role: 'assistant', content: 'Bonjour' },
      { role: 'user', content: 'Et en Python ?' },
    ]);
  });

  it('places the attachments just before the question', () => {
    const messages = toMessages(
      context({
        attachments: [{ name: 'notes.md', mimeType: 'text/plain', data: Buffer.from('Bonjour') }],
      }),
    );

    const last = messages.at(-1)!.content;
    expect(last.indexOf('notes.md')).toBeLessThan(last.indexOf('Et en Python ?'));
  });
});
